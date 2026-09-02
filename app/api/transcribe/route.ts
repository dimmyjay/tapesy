import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";

const ASSEMBLYAI_BASE_URL =
  "https://api.assemblyai.com/v2/transcript";

const MAX_SUBMIT_RETRIES = 3;
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL = 3000;
const REQUEST_TIMEOUT = 30000;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseResponse(response: Response) {
  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    text,
    data,
  };
}

// --------------------------------------------------
// POST
// --------------------------------------------------

export async function POST(req: NextRequest) {
  let songId = "";

  try {
    // --------------------------------------------------
    // 1. READ REQUEST
    // --------------------------------------------------

    let body: any;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        {
          status: 400,
        }
      );
    }

    const {
      audioUrl,
    } = body;

    songId = body.songId;

    console.log(
      "🎤 Starting Transcription for Song ID:",
      songId
    );

    console.log(
      "🔗 Audio URL:",
      audioUrl
    );

    // --------------------------------------------------
    // 2. VALIDATION
    // --------------------------------------------------

    if (!audioUrl || !songId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing audioUrl or songId",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof audioUrl !== "string" ||
      !audioUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid audio URL. AssemblyAI requires a publicly accessible HTTPS URL.",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey =
      process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ASSEMBLYAI_API_KEY is missing from .env.local",
        },
        {
          status: 500,
        }
      );
    }

    const songRef = ref(
      db,
      `songs/${songId}`
    );

    // --------------------------------------------------
    // 3. MARK TRANSCRIPTION AS SUBMITTING
    // --------------------------------------------------

    await update(songRef, {
      transcriptionStatus: "submitting",
      transcriptionError: "",
    });

    // --------------------------------------------------
    // 4. SUBMIT TO ASSEMBLYAI
    // --------------------------------------------------

    let submitData: any = null;
    let lastSubmitError: any = null;

    for (
      let attempt = 1;
      attempt <= MAX_SUBMIT_RETRIES;
      attempt++
    ) {
      try {
        console.log(
          `📡 AssemblyAI submission attempt ${attempt}/${MAX_SUBMIT_RETRIES}`
        );

        const submitResponse =
          await fetchWithTimeout(
            ASSEMBLYAI_BASE_URL,
            {
              method: "POST",

              headers: {
                authorization: apiKey,
                "content-type":
                  "application/json",
              },

              body: JSON.stringify({
                audio_url: audioUrl,

                // English transcription
                language_code: "en_us",

                // Better formatted transcript
                punctuate: true,
                format_text: true,

                // We need word timestamps
                // for synchronized lyrics
                word_boost: [],
              }),
            }
          );

        const {
          text: submitText,
          data,
        } =
          await parseResponse(
            submitResponse
          );

        console.log(
          "📡 AssemblyAI response:",
          submitText
        );

        if (!submitResponse.ok) {
          throw new Error(
            `AssemblyAI submit failed (${submitResponse.status}): ${submitText}`
          );
        }

        if (!data) {
          throw new Error(
            "AssemblyAI returned an invalid JSON response"
          );
        }

        submitData = data;

        break;
      } catch (error: any) {
        lastSubmitError = error;

        const message =
          error?.name ===
          "AbortError"
            ? "AssemblyAI connection timed out"
            : error?.message ||
              "Unknown AssemblyAI connection error";

        console.error(
          `❌ AssemblyAI submission attempt ${attempt} failed:`,
          message
        );

        if (
          attempt <
          MAX_SUBMIT_RETRIES
        ) {
          const retryDelay =
            attempt * 3000;

          console.log(
            `🔁 Retrying AssemblyAI in ${retryDelay}ms...`
          );

          await sleep(
            retryDelay
          );
        }
      }
    }

    // --------------------------------------------------
    // 5. SUBMISSION FAILED
    // --------------------------------------------------

    if (!submitData) {
      const errorMessage =
        lastSubmitError?.name ===
        "AbortError"
          ? "AssemblyAI connection timed out after multiple attempts. Please try transcription again."
          : lastSubmitError?.message ||
            "Unable to connect to AssemblyAI.";

      await update(songRef, {
        transcriptionStatus: "failed",
        transcriptionError:
          errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        {
          status: 503,
        }
      );
    }

    // --------------------------------------------------
    // 6. GET TRANSCRIPT ID
    // --------------------------------------------------

    const transcriptId =
      submitData.id;

    if (!transcriptId) {
      throw new Error(
        "AssemblyAI did not return a transcript ID"
      );
    }

    console.log(
      "✅ Transcription Job Submitted:",
      transcriptId
    );

    // --------------------------------------------------
    // 7. SAVE PROCESSING STATE
    // --------------------------------------------------

    await update(songRef, {
      transcriptionStatus: "processing",
      transcriptionId:
        transcriptId,
      transcriptionError: "",
    });

    // --------------------------------------------------
    // 8. POLL ASSEMBLYAI
    // --------------------------------------------------

    let transcriptData: any =
      null;

    for (
      let attempt = 1;
      attempt <= MAX_POLL_ATTEMPTS;
      attempt++
    ) {
      await sleep(
        POLL_INTERVAL
      );

      try {
        const pollResponse =
          await fetchWithTimeout(
            `${ASSEMBLYAI_BASE_URL}/${transcriptId}`,
            {
              method: "GET",

              headers: {
                authorization: apiKey,
              },
            }
          );

        const {
          text: pollText,
          data,
        } =
          await parseResponse(
            pollResponse
          );

        if (!pollResponse.ok) {
          throw new Error(
            `AssemblyAI polling failed (${pollResponse.status}): ${pollText}`
          );
        }

        if (!data) {
          throw new Error(
            "AssemblyAI returned invalid polling data"
          );
        }

        transcriptData = data;

        console.log(
          `⏳ Attempt ${attempt}/${MAX_POLL_ATTEMPTS}:`,
          transcriptData.status
        );

        // --------------------------------------------------
        // COMPLETED
        // --------------------------------------------------

        if (
          transcriptData.status ===
          "completed"
        ) {
          break;
        }

        // --------------------------------------------------
        // FAILED
        // --------------------------------------------------

        if (
          transcriptData.status ===
          "error"
        ) {
          throw new Error(
            transcriptData.error ||
              "AssemblyAI transcription failed"
          );
        }
      } catch (error: any) {
        console.error(
          `⚠️ Polling error ${attempt}/${MAX_POLL_ATTEMPTS}:`,
          error?.message
        );

        // Don't immediately kill the entire job
        // because temporary network errors can happen.
        if (
          attempt ===
          MAX_POLL_ATTEMPTS
        ) {
          throw error;
        }
      }
    }

    // --------------------------------------------------
    // 9. TIMEOUT
    // --------------------------------------------------

    if (
      !transcriptData ||
      transcriptData.status !==
        "completed"
    ) {
      const errorMessage =
        "AssemblyAI transcription timed out.";

      await update(songRef, {
        transcriptionStatus:
          "timeout",

        transcriptionError:
          errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        {
          status: 504,
        }
      );
    }

    console.log(
      "✅ Transcription completed"
    );

    // --------------------------------------------------
    // 10. GET WORDS
    // --------------------------------------------------

    const words =
      Array.isArray(
        transcriptData.words
      )
        ? transcriptData.words
        : [];

    console.log(
      `📝 Words detected: ${words.length}`
    );

    // --------------------------------------------------
    // 11. NORMALIZE WORD TIMESTAMPS
    // --------------------------------------------------

    const syncedWords =
      words
        .map((word: any) => ({
          start:
            Number(word.start) /
            1000,

          end:
            Number(word.end) /
            1000,

          text:
            String(
              word.text || ""
            ).trim(),

          confidence:
            typeof word.confidence ===
            "number"
              ? word.confidence
              : null,
        }))
        .filter(
          (word: any) =>
            word.text &&
            Number.isFinite(
              word.start
            ) &&
            Number.isFinite(
              word.end
            )
        );

    // --------------------------------------------------
    // 12. CREATE SYNCHRONIZED LYRIC LINES
    // --------------------------------------------------

    const syncedLyrics: {
      time: number;
      endTime: number;
      text: string;
      words: {
        start: number;
        end: number;
        text: string;
      }[];
    }[] = [];

    let currentLine:
      | {
          time: number;
          endTime: number;
          text: string;
          words: {
            start: number;
            end: number;
            text: string;
          }[];
        }
      | null = null;

    const MAX_WORDS_PER_LINE = 8;
    const MAX_LINE_DURATION = 5;

    for (
      const word of syncedWords
    ) {
      // --------------------------------------------------
      // FIRST WORD
      // --------------------------------------------------

      if (!currentLine) {
        currentLine = {
          time: word.start,

          endTime: word.end,

          text: word.text,

          words: [
            {
              start: word.start,
              end: word.end,
              text: word.text,
            },
          ],
        };

        continue;
      }

      const lineDuration =
        word.end -
        currentLine.time;

      const endsWithPunctuation =
        /[.!?,;:]$/.test(
          word.text
        );

      const shouldCreateNewLine =
        lineDuration >=
          MAX_LINE_DURATION ||
        currentLine.words.length >=
          MAX_WORDS_PER_LINE ||
        endsWithPunctuation;

      // --------------------------------------------------
      // NEW LINE
      // --------------------------------------------------

      if (
        shouldCreateNewLine
      ) {
        syncedLyrics.push(
          currentLine
        );

        currentLine = {
          time: word.start,

          endTime: word.end,

          text: word.text,

          words: [
            {
              start: word.start,
              end: word.end,
              text: word.text,
            },
          ],
        };

        continue;
      }

      // --------------------------------------------------
      // ADD WORD TO CURRENT LINE
      // --------------------------------------------------

      currentLine.text +=
        ` ${word.text}`;

      currentLine.endTime =
        word.end;

      currentLine.words.push({
        start: word.start,
        end: word.end,
        text: word.text,
      });
    }

    // --------------------------------------------------
    // ADD FINAL LINE
    // --------------------------------------------------

    if (currentLine) {
      syncedLyrics.push(
        currentLine
      );
    }

    // --------------------------------------------------
    // 13. FINAL TRANSCRIPT
    // --------------------------------------------------

    const finalTranscript =
      String(
        transcriptData.text ||
          ""
      ).trim() ||
      "No lyrics detected.";

    console.log(
      `✨ Final transcript length: ${finalTranscript.length}`
    );

    console.log(
      `🎵 Synced lyric lines: ${syncedLyrics.length}`
    );

    // --------------------------------------------------
    // 14. SAVE TO FIREBASE
    // --------------------------------------------------

    await update(songRef, {
      lyrics: finalTranscript,

      syncedLyrics,

      transcriptionStatus:
        "completed",

      transcriptionId:
        transcriptId,

      transcriptionError:
        "",

      transcribedAt:
        Date.now(),

      // Optional useful metadata
      transcriptionWordCount:
        syncedWords.length,
    });

    console.log(
      "🔥 Lyrics successfully saved to Firebase"
    );

    // --------------------------------------------------
    // 15. RETURN RESULT
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        songId,

        lyrics:
          finalTranscript,

        syncedLyrics,

        syncedLyricsCount:
          syncedLyrics.length,

        syncedWordCount:
          syncedWords.length,

        transcriptionId:
          transcriptId,

        status: "completed",
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    // --------------------------------------------------
    // GLOBAL ERROR HANDLER
    // --------------------------------------------------

    console.error(
      "🚨 Transcription Route Error:",
      error
    );

    // Try to update Firebase if we have
    // a valid song ID
    if (songId) {
      try {
        const songRef = ref(
          db,
          `songs/${songId}`
        );

        await update(songRef, {
          transcriptionStatus:
            "failed",

          transcriptionError:
            error?.message ||
            "Failed to transcribe audio",
        });
      } catch (firebaseError) {
        console.error(
          "⚠️ Could not save transcription error to Firebase:",
          firebaseError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to transcribe audio",
      },
      {
        status: 500,
      }
    );
  }
}
