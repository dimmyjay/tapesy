import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  ref,
  get,
  remove,
} from "firebase/database";

import { v2 as cloudinary } from "cloudinary";

// ----------------------------------------
// Cloudinary server configuration
// ----------------------------------------

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET,
});

// ----------------------------------------
// DELETE SONG
// ----------------------------------------

export async function DELETE(
  req: NextRequest
) {
  try {
    console.log(
      "🗑️ Delete song request received"
    );

    // ----------------------------------------
    // Check content type
    // ----------------------------------------

    const contentType =
      req.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Request must use application/json",
        },
        {
          status: 415,
        }
      );
    }

    // ----------------------------------------
    // Read body safely
    // ----------------------------------------

    const rawBody =
      await req.text();

    if (!rawBody.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Request body is empty.",
        },
        {
          status: 400,
        }
      );
    }

    let body: any;

    try {
      body =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      songId,
      userId,
    } = body;

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!songId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Song ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------
    // Get song
    // ----------------------------------------

    const songRef = ref(
      db,
      `songs/${songId}`
    );

    const snapshot =
      await get(songRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Song not found.",
        },
        {
          status: 404,
        }
      );
    }

    const song =
      snapshot.val();

    // ----------------------------------------
    // Verify ownership
    // ----------------------------------------

    if (
      song.uploadedBy !==
      userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not allowed to delete this song.",
        },
        {
          status: 403,
        }
      );
    }

    // ----------------------------------------
    // Delete audio from Cloudinary
    // ----------------------------------------

    if (song.audioPublicId) {
      try {
        console.log(
          "☁️ Deleting audio:",
          song.audioPublicId
        );

        const result =
          await cloudinary.uploader.destroy(
            song.audioPublicId,
            {
              resource_type:
                song.audioResourceType ||
                "video",

              invalidate: true,
            }
          );

        console.log(
          "☁️ Audio deletion result:",
          result
        );
      } catch (error) {
        console.error(
          "⚠️ Audio Cloudinary deletion failed:",
          error
        );
      }
    }

    // ----------------------------------------
    // Delete image from Cloudinary
    // ----------------------------------------

    if (song.imagePublicId) {
      try {
        console.log(
          "☁️ Deleting cover:",
          song.imagePublicId
        );

        const result =
          await cloudinary.uploader.destroy(
            song.imagePublicId,
            {
              resource_type:
                song.imageResourceType ||
                "image",

              invalidate: true,
            }
          );

        console.log(
          "☁️ Image deletion result:",
          result
        );
      } catch (error) {
        console.error(
          "⚠️ Image Cloudinary deletion failed:",
          error
        );
      }
    }

    // ----------------------------------------
    // Delete from Firebase
    // ----------------------------------------

    await remove(songRef);

    console.log(
      "✅ Song deleted from Firebase:",
      songId
    );

    return NextResponse.json({
      success: true,

      message:
        "Song deleted successfully.",

      songId,
    });
  } catch (error: any) {
    console.error(
      "❌ Delete song error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Failed to delete song.",
      },
      {
        status: 500,
      }
    );
  }
}