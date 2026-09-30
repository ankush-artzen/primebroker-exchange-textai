"use client";

import { useEffect } from "react";
import { ButtonLoader } from "@/components/Loader";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        disabled={loading}
        onClick={() => {
          if (!loading) onCancel();
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl"
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-primary"
        >
          {title}
        </h2>
        {description ? (
          <p id="confirm-dialog-desc" className="mt-2 text-sm text-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-primary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            {loading ? <ButtonLoader label="Deleting…" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
