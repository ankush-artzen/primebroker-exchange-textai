"use client";

import { useEffect, useState } from "react";
import { cn, formatPhone, normalizeIndianPhone } from "@/lib/utils";
import { fieldErrorBorder, fieldErrorText } from "@/lib/form-errors";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  variant?: "default" | "add";
  className?: string;
  error?: string;
}

export function PhoneField({
  value,
  onChange,
  label = "Phone *",
  required = true,
  variant = "default",
  className,
  error,
}: Props) {
  const [number, setNumber] = useState("");

  useEffect(() => {
    setNumber(normalizeIndianPhone(value));
  }, [value]);

  const update = (nextNumber: string) => {
    const digits = formatPhone(nextNumber).slice(0, 10);
    setNumber(digits);
    onChange(digits);
  };

  const labelClass =
    variant === "add"
      ? "mb-1.5 block text-xs font-semibold text-muted"
      : "mb-1 block text-sm font-medium text-zinc-700";

  const inputClass =
    variant === "add"
      ? "w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
      : "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className={className} data-field-error={error ? "true" : undefined}>
      <label className={labelClass}>
        {label}
        {!required && !label.includes("*") ? "" : null}
      </label>
      <input
        type="tel"
        inputMode="numeric"
        value={number}
        maxLength={10}
        onChange={(e) => update(e.target.value)}
        placeholder="10-digit mobile number"
        className={cn(inputClass, error && fieldErrorBorder)}
      />
      {error ? (
        <p className={fieldErrorText}>{error}</p>
      ) : (
        number &&
        number.length !== 10 && (
          <p className="mt-1 text-[11px] text-muted">
            Enter 10-digit mobile number
          </p>
        )
      )}
    </div>
  );
}
