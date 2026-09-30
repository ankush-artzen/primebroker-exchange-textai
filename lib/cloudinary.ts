import { v2 as cloudinary } from "cloudinary";

const UPLOAD_FOLDER = "prime-brokers";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function publicIdFromCloudinaryUrl(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (cloudName && !url.includes(cloudName)) return null;

  const marker = `/${UPLOAD_FOLDER}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const filename = url.slice(idx + marker.length).split("?")[0];
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  return `${UPLOAD_FOLDER}/${withoutExt}`;
}

export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  if (!isCloudinaryConfigured() || urls.length === 0) return;

  const publicIds = urls
    .map(publicIdFromCloudinaryUrl)
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  try {
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: "image",
      type: "upload",
    });
  } catch (error) {
    console.error("cloudinary delete error:", error);
  }
}
