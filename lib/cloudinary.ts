export type CloudinaryUploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  duration?: number;
};

export async function uploadToCloudinary(
  file: File,
  type: "audio" | "image"
): Promise<CloudinaryUploadResult> {
  if (!file) {
    throw new Error("No file selected.");
  }

  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  console.log("☁️ Cloudinary configuration:", {
    cloudName,
    uploadPreset,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadType: type,
  });

  if (!cloudName) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing. Check your .env.local file and restart Next.js."
    );
  }

  if (!uploadPreset) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is missing. Check your .env.local file and restart Next.js."
    );
  }

  // Cloudinary treats audio/video as resource_type = video
  const resourceType =
    type === "audio" ? "video" : "image";

  const endpoint =
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  console.log("☁️ Upload endpoint:", endpoint);

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  formData.append(
    "folder",
    type === "audio"
      ? "tapesy/audio"
      : "tapesy/covers"
  );

  try {
    console.log("☁️ Starting Cloudinary upload...");

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();

    console.log(
      "☁️ Cloudinary HTTP status:",
      response.status
    );

    console.log(
      "☁️ Cloudinary response:",
      responseText
    );

    let data: any;

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        `Cloudinary returned an invalid response: ${responseText}`
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          `Cloudinary upload failed with status ${response.status}`
      );
    }

    if (!data.secure_url) {
      throw new Error(
        "Cloudinary upload succeeded but no secure URL was returned."
      );
    }

    if (!data.public_id) {
      throw new Error(
        "Cloudinary upload succeeded but no public ID was returned."
      );
    }

    console.log("✅ Cloudinary upload successful");

    return {
      url: data.secure_url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type || resourceType,
      duration: data.duration,
    };
  } catch (error: any) {
    console.error(
      "❌ Cloudinary upload failed:",
      error
    );

    // Browser/network failure
    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw new Error(
        "Could not connect to Cloudinary. Check your Cloudinary cloud name, unsigned upload preset, internet connection, browser extensions, and .env.local configuration."
      );
    }

    throw new Error(
      error?.message ||
        "Cloudinary upload failed."
    );
  }
}