import { NextRequest } from "next/server";
import { getUserId, unauthorized } from "@/lib/api-auth";
import { deleteCloudinaryImages, isCloudinaryConfigured } from "@/lib/cloudinary";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  if (!isCloudinaryConfigured()) {
    return Response.json(
      { error: "Cloudinary not configured" },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "prime-brokers", resource_type: "image" },
              (err, res) => {
                if (err || !res) reject(err ?? new Error("Upload failed"));
                else resolve(res);
              },
            )
            .end(buffer);
        },
      );

      urls.push(result.secure_url);
    }

    return Response.json({ urls });
  } catch (error) {
    console.error("upload error:", error);
    return Response.json({ error: "Failed to upload photos" }, { status: 500 });
  }
}
