"use client";

import { Camera, LoaderCircle, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

export default function PhotoUploader({
  photos,
  onChange,
  max = 4,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    const next = [...photos];
    try {
      for (const file of Array.from(files).slice(0, max - photos.length)) {
        if (file.size > 8 * 1024 * 1024) throw new Error("Photos must be smaller than 8 MB");
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body });
        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) throw new Error(data.error || "Upload failed");
        next.push(data.url);
      }
      onChange(next.slice(0, max));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <figure className="photo-tile" key={photo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`Profile photo ${index + 1}`} />
            {index === 0 ? <figcaption>Main</figcaption> : null}
            <button
              type="button"
              className="photo-remove"
              aria-label="Remove photo"
              onClick={() => onChange(photos.filter((item) => item !== photo))}
            >
              <X size={14} />
            </button>
          </figure>
        ))}

        {photos.length < max ? (
          <button
            type="button"
            className="photo-add"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <LoaderCircle className="spin" size={22} /> : <Plus size={22} />}
            <span>{uploading ? "Uploading…" : "Add photo"}</span>
            <small>JPEG, PNG or WebP · 8 MB</small>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <p className="photo-hint">
        <Camera size={14} /> Your first photo appears in Discover. You can add up to {max}.
      </p>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
