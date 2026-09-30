"use client";

import { addDays } from "@/lib/utils";
import { Spinner } from "@/components/Loader";

interface Props {
  onReschedule: (date: Date) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function RescheduleButtons({
  onReschedule,
  loading,
  disabled,
}: Props) {
  const options = [
    { label: "Tomorrow", days: 1 },
    { label: "3 days", days: 3 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          disabled={disabled || loading}
          onClick={() => onReschedule(addDays(new Date(), opt.days))}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-background active:bg-background disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}
      {loading ? <Spinner size={16} className="text-primary" /> : null}
    </div>
  );
}
