import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { rateLimit } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "heif"]);

export async function POST(request: Request) {
  try {
    const current = await getApiUser();
    if (!current) return NextResponse.json({ error: "Sign in to upload a photo" }, { status: 401 });

    const limit = rateLimit(`upload:${current.id}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "That is a lot of photos at once. Try again in a minute." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a photo first" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Photos must be smaller than 8 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer, { limitInputPixels: 50_000_000 });
    const metadata = await image.metadata();
    if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, WebP or AVIF photo" },
        { status: 415 },
      );
    }
    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "That image could not be read" }, { status: 415 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${current.id.replace(/[^a-zA-Z0-9_-]/g, "")}-${crypto.randomUUID()}.webp`;
    const output = await image
      .rotate()
      .resize(1200, 1500, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    await writeFile(path.join(uploadDir, filename), output);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      width: 1200,
      height: 1500,
    });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "That photo could not be saved" }, { status: 500 });
  }
}
