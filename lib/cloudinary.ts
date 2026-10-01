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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Cloudinary request timed out"));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  if (!isCloudinaryConfigured() || urls.length === 0) return;

  const publicIds = urls
    .map(publicIdFromCloudinaryUrl)
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  try {
    await withTimeout(
      cloudinary.api.delete_resources(publicIds, {
        resource_type: "image",
        type: "upload",
      }),
      4000,
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (
      code === "ENOTFOUND" ||
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      (error instanceof Error && error.message === "Cloudinary request timed out")
    ) {
      console.error(
        "Cloudinary cleanup skipped: could not reach api.cloudinary.com",
      );
      return;
    }
    console.error("cloudinary delete error:", error);
  }
}
