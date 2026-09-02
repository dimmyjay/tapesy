import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  ref,
  push,
  set,
} from "firebase/database";

export async function POST(req: NextRequest) {
  try {
    console.log("📥 /api/upload request received");

    // ----------------------------------------
    // Parse request body safely
    // ----------------------------------------

    const contentType =
      req.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Request must use application/json",
        },
        {
          status: 415,
        }
      );
    }

    const body = await req.json();

    console.log("📦 Upload body received:", {
      title: body?.title,
      artist: body?.artist,
      genre: body?.genre,
      audioUrl: body?.audioUrl,
      imageUrl: body?.imageUrl,
      audioPublicId: body?.audioPublicId,
      imagePublicId: body?.imagePublicId,
    });

    // ----------------------------------------
    // Extract data
    // ----------------------------------------

    const {
      title,
      artist,
      genre,
      audioUrl,
      imageUrl,
      audioPublicId,
      imagePublicId,
      duration,
      testimony,
      chords,
      season,
      verified,
      tipLink,
    } = body;

    // ----------------------------------------
    // Authentication
    // ----------------------------------------

    const userId =
      req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Song title is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!artist || !String(artist).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Artist name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!genre || !String(genre).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Genre is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!audioUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Audio URL is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Cover image URL is required",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // Validate URLs
    // ----------------------------------------

    if (
      typeof audioUrl !== "string" ||
      !audioUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid audio URL",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof imageUrl !== "string" ||
      !imageUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cover image URL",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // Duration
    // ----------------------------------------

    const parsedDuration =
      Number(duration);

    const safeDuration =
      Number.isFinite(parsedDuration) &&
      parsedDuration >= 0
        ? parsedDuration
        : 0;

    // ----------------------------------------
    // Create Firebase reference
    // ----------------------------------------

    const songsRef = ref(db, "songs");

    const newSongRef =
      push(songsRef);

    const songId =
      newSongRef.key;

    if (!songId) {
      throw new Error(
        "Could not generate song ID"
      );
    }

    // ----------------------------------------
    // Song object
    // ----------------------------------------

    const songData = {
      id: songId,

      title: String(title).trim(),

      artist: String(artist).trim(),

      genre: String(genre)
        .trim()
        .toUpperCase(),

      audioUrl: String(audioUrl),

      imageUrl: String(imageUrl),

      // Cloudinary IDs
      audioPublicId:
        audioPublicId
          ? String(audioPublicId)
          : "",

      imagePublicId:
        imagePublicId
          ? String(imagePublicId)
          : "",

      // Cloudinary resource types
      audioResourceType: "video",

      imageResourceType: "image",

      duration: safeDuration,

      testimony:
        testimony
          ? String(testimony)
          : "",

      chords:
        chords
          ? String(chords)
          : "",

      season:
        season
          ? String(season)
          : "GENERAL",

      verified:
        verified === true,

      tipLink:
        tipLink
          ? String(tipLink)
          : "",

      // Owner
      uploadedBy: userId,

      // Timestamp
      createdAt: Date.now(),

      // Transcription
      transcriptionStatus:
        "pending",

      transcriptionId: "",

      transcriptionError: "",

      transcriptionWordCount: 0,

      lyrics: "",

      syncedLyrics: [],

      transcribedAt: null,
    };

    // ----------------------------------------
    // Save to Firebase
    // ----------------------------------------

    await set(
      newSongRef,
      songData
    );

    console.log(
      "✅ Song saved to Firebase:",
      songId
    );

    // ----------------------------------------
    // Response
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,

        songId,

        song: songData,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "❌ Database save error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}