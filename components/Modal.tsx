"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-[26px] bg-background shadow-xl sm:rounded-2xl">
        {title ? (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted hover:bg-surface"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}
        <div className={cn("overflow-y-auto p-4", !title && "pt-2")}>{children}</div>
      </div>
    </div>
  );
}
