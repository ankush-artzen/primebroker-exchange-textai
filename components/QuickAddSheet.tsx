"use client";

import { useEffect } from "react";
import { Home, User } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAddLead: () => void;
  onAddProperty: () => void;
}

export function QuickAddSheet({
  open,
  onClose,
  onAddLead,
  onAddProperty,
}: Props) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-[2rem] bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <div className="mb-5">
          <h2 className="font-serif text-2xl text-primary">Quick add</h2>
          <p className="mt-1 text-sm text-muted">
            What would you like to save?
          </p>
        </div>

        <div className="space-y-3">
          <QuickAddOption
            icon={<User size={22} strokeWidth={1.75} />}
            label="Add a lead"
            onClick={() => {
              onClose();
              onAddLead();
            }}
          />
          <QuickAddOption
            icon={<Home size={22} strokeWidth={1.75} />}
            label="Add a property"
            onClick={() => {
              onClose();
              onAddProperty();
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center rounded-2xl border border-border bg-surface px-5 py-4 text-left font-semibold text-primary transition-colors active:bg-background"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAddOption({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-left font-semibold text-primary transition-colors active:bg-background"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </button>
  );
}
