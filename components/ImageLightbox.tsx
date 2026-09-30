"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
  variant?: "fullscreen" | "modal";
}

export function ImageLightbox({
  open,
  src,
  alt,
  onClose,
  variant = "fullscreen",
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-black/95 p-4",
        variant === "modal"
          ? "absolute inset-0 z-20 rounded-b-2xl"
          : "fixed inset-0 z-[100]",
      )}
    >
      <button
        type="button"
        aria-label="Close image"
        className="absolute inset-0"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm"
      >
        <X size={22} />
      </button>
      <div className="relative z-[1] h-full w-full max-h-[70vh]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 512px) 100vw, 512px"
          priority
        />
      </div>
    </div>
  );
}
