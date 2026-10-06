"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { propertyFloorOptions } from "@/lib/constants/property";
import { fieldErrorBorder } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { FieldMessage } from "@/components/property-form/messages";

export const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/25";

export function Choices({
  label,
  value,
  options,
  onChange,
  error,
  hint,
  columns,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  columns?: 2 | 3 | 4 | 5;
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className={cn("text-[13px] font-medium text-foreground", hint ? "" : "mb-2")}>{label}</p>
      {hint ? <p className="mb-2 mt-0.5 text-[12px] leading-relaxed text-muted">{hint}</p> : null}
      <div
        className={cn(
          columns ? "grid gap-1.5" : "flex flex-wrap gap-2",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
          columns === 5 && "grid-cols-5",
        )}
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "border text-sm font-medium transition-colors",
                columns ? "rounded-xl px-1 py-2.5 text-center" : "rounded-full px-3.5 py-2",
                selected
                  ? "border-primary bg-primary text-foreground"
                  : "border-border bg-background text-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <FieldMessage>{error}</FieldMessage>}
    </div>
  );
}

export function MultiChoices({
  label,
  values,
  options,
  onToggle,
}: {
  label: string;
  values: string[];
  options: readonly { id: string; label: string }[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-secondary-tint text-secondary-dark"
                  : "border-border bg-background text-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, error && fieldErrorBorder, disabled && "opacity-60")}
      >
        {allowEmpty && <option value="">{placeholder ?? "Select"}</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <FieldMessage>{error}</FieldMessage>}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, error && fieldErrorBorder)}
      />
      {error && <FieldMessage>{error}</FieldMessage>}
    </div>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2 text-sm font-medium text-foreground", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#D4AF37]"
      />
      {label}
    </label>
  );
}

export function PropertyFloorSelect({
  label,
  value,
  totalFloors,
  onChange,
  placeholder = "Select floor",
}: {
  label?: string;
  value: string;
  totalFloors: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const options = propertyFloorOptions(totalFloors, value);
  if (label) {
    return (
      <SelectField
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
      />
    );
  }
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function RoomCount({
  label,
  value,
  maxChip,
  onChange,
  otherLabel = "+ Add other",
}: {
  label: string;
  value: string;
  maxChip: number;
  onChange: (value: string) => void;
  otherLabel?: string;
}) {
  const options = Array.from({ length: maxChip }, (_, index) => {
    const id = String(index + 1);
    return { id, label: id };
  });
  const custom = value !== "" && !options.some((option) => option.id === value);
  const [open, setOpen] = useState(custom);

  return (
    <div>
      <Choices
        label={label}
        value={custom ? "" : value}
        options={options}
        onChange={(next) => {
          setOpen(false);
          onChange(next);
        }}
        columns={4}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-medium text-primary"
      >
        {otherLabel}
      </button>
      {open && (
        <input
          type="number"
          inputMode="numeric"
          min={maxChip + 1}
          value={custom ? value : ""}
          placeholder="Enter number"
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "mt-2")}
        />
      )}
    </div>
  );
}

export function CountStepper({
  label,
  value,
  onChange,
  divided,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  divided?: boolean;
}) {
  const count = Number.parseInt(value, 10);
  const current = Number.isFinite(count) && count > 0 ? count : 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5",
        divided && "border-t border-border",
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(current <= 1 ? "" : String(current - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground"
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums text-foreground">
          {current}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(String(current + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
