"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadFormData } from "@/lib/types";
import {
  cn,
  isValidIndianPhone,
  isValidPersonName,
  normalizeFollowUpInput,
  addDays,
  toDatetimeLocalValue,
  sanitizePersonName,
  type LeadStatus,
} from "@/lib/utils";
import { getConfigurationOptions } from "@/lib/constants/property";
import {
  fieldErrorBorder,
  fieldErrorText,
  formatMissingFieldsSummary,
  scrollToFirstFieldError,
  formErrorBanner,
} from "@/lib/form-errors";
import { PhoneField } from "@/components/PhoneField";
import { PriceField } from "@/components/PriceField";
import { LocationPicker } from "@/components/LocationPicker";
import { ButtonLoader } from "@/components/Loader";
import { CalendarDays } from "lucide-react";

const emptyLead: LeadFormData = {
  name: "",
  phone: "",
  requirement: "",
  location: "",
  budget: "",
  source: "",
  notes: "",
  followUpDate: "",
  status: "new",
};

const statusOptions: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "negotiation", label: "Negotiation" },
];

interface Props {
  initial?: Partial<LeadFormData>;
  onSubmit: (data: LeadFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  variant?: "default" | "add";
}

export function LeadForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save lead",
  variant = "default",
}: Props) {
  type LeadField = "name" | "phone";

  const [form, setForm] = useState<LeadFormData>(() => ({
    ...emptyLead,
    ...initial,
    followUpDate: initial?.followUpDate
      ? toDatetimeLocalValue(initial.followUpDate)
      : "",
    status: initial?.status ?? "new",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<LeadField, string>>
  >({});

  useEffect(() => {
    setForm({
      ...emptyLead,
      ...initial,
      followUpDate: initial?.followUpDate
      ? toDatetimeLocalValue(initial.followUpDate)
      : "",
      status: initial?.status ?? "new",
    });
  }, [initial]);

  const update = (field: keyof LeadFormData, value: string) => {
    const nextValue = field === "name" ? sanitizePersonName(value) : value;
    setForm((f) => ({ ...f, [field]: nextValue }));
    if (field in fieldErrors) {
      setFieldErrors((errors) => {
        const next = { ...errors };
        delete next[field as LeadField];
        return next;
      });
    }
    if (error) setError("");
  };

  const validate = () => {
    const errors: Partial<Record<LeadField, string>> = {};

    if (!form.name.trim()) {
      errors.name = "Name is required";
    } else if (!isValidPersonName(form.name)) {
      errors.name = "Name can only contain letters";
    }
    if (!form.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (!isValidIndianPhone(form.phone)) {
      errors.phone = "Enter a valid 10-digit mobile number";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const labels: Record<LeadField, string> = {
        name: "Name",
        phone: "Phone",
      };
      setError(
        formatMissingFieldsSummary(
          Object.keys(errors).map((key) => labels[key as LeadField]),
        ),
      );
      scrollToFirstFieldError();
      return;
    }

    setFieldErrors({});
    const followUpDate = normalizeFollowUpInput(form.followUpDate ?? "");

    setLoading(true);
    try {
      await onSubmit({
        ...form,
        followUpDate,
        status: form.status ?? "new",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const isAdd = variant === "add";

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && (
        <p className={formErrorBanner}>
          {error}
        </p>
      )}

      <Field
        label={isAdd ? "Name" : "Name *"}
        value={form.name}
        onChange={(v) => update("name", v)}
        placeholder={isAdd ? "Full name" : undefined}
        variant={variant}
        error={fieldErrors.name}
      />

      <PhoneField
        value={form.phone}
        onChange={(v) => update("phone", v)}
        label={isAdd ? "Phone" : "Phone *"}
        variant={variant}
        error={fieldErrors.phone}
      />

      <RequirementField
        value={form.requirement ?? ""}
        onChange={(v) => update("requirement", v)}
        variant={variant}
      />

      <LocationPicker
        value={form.location ?? ""}
        onChange={(v) => update("location", v)}
      />

      <PriceField
        value={form.budget ?? ""}
        onChange={(v) => update("budget", v)}
        label="Budget"
        variant={variant}
      />

      {!isAdd && (
        <Field
          label="Source"
          value={form.source ?? ""}
          onChange={(v) => update("source", v)}
          placeholder="Referral, portal..."
          variant={variant}
        />
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => update("status", option.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                (form.status ?? "new") === option.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <FollowUpDateField
        label={isAdd ? "Next follow-up" : "Follow-up date"}
        value={form.followUpDate ?? ""}
        onChange={(v) => update("followUpDate", v)}
        variant={variant}
      />

      <NotesField
        value={form.notes ?? ""}
        onChange={(v) => update("notes", v)}
        minRows={isAdd ? 2 : 3}
        placeholder={isAdd ? "Anything else worth remembering" : undefined}
        variant={variant}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? <ButtonLoader label="Saving…" /> : submitLabel}
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-sm text-muted"
        >
          Cancel
        </button>
      )}
    </form>
  );
}

function RequirementField({
  value,
  onChange,
  variant = "default",
}: {
  value: string;
  onChange: (v: string) => void;
  variant?: "default" | "add";
}) {
  const labelClass =
    variant === "add"
      ? "mb-1.5 block text-xs font-semibold text-muted"
      : "mb-1 block text-sm font-medium text-zinc-700";

  const selectClass =
    variant === "add"
      ? "w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
      : "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div>
      <label className={labelClass}>Requirement</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Select requirement</option>
        {getConfigurationOptions(value).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// function FollowUpDateField({
//   label,
//   value,
//   onChange,
//   variant = "default",
// }: {
//   label: string;
//   value: string;
//   onChange: (v: string) => void;
//   variant?: "default" | "add";
// }) {
//   const inputClass =
//     variant === "add"
//       ? "w-full rounded-[10px] border border-border bg-surface py-2.5 pl-3 pr-10 text-sm text-primary outline-none focus:border-primary [color-scheme:light]"
//       : "w-full rounded-xl border border-zinc-200 py-2.5 pl-3 pr-10 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 [color-scheme:light]";

//   const labelClass =
//     variant === "add"
//       ? "mb-1.5 block text-xs font-semibold text-muted"
//       : "mb-1 block text-sm font-medium text-zinc-700";

//   const shortcuts = [
//     { label: "Today", days: 0 },
//     { label: "Tomorrow", days: 1 },
//     { label: "3 days", days: 3 },
//     { label: "1 week", days: 7 },
//   ];

//   return (
//     <div>
//       <label className={labelClass}>{label}</label>
//       <div className="relative">
//         <input
//           type="date"
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           className={inputClass}
//         />
//         <CalendarDays
//           size={18}
//           className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
//         />
//       </div>
//       <div className="mt-2 flex flex-wrap gap-2">
//         {shortcuts.map((opt) => {
//           const dateKey = formatDateKey(addDays(new Date(), opt.days));
//           const selected = value === dateKey;
//           return (
//             <button
//               key={opt.label}
//               type="button"
//               onClick={() => onChange(dateKey)}
//               className={cn(
//                 "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
//                 selected
//                   ? "border-primary bg-primary text-primary-foreground"
//                   : "border-border bg-surface text-muted",
//               )}
//             >
//               {opt.label}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
function FollowUpDateField({
  label,
  value,
  onChange,
  variant = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  variant?: "default" | "add";
}) {
  const inputClass =
    variant === "add"
      ? "w-full rounded-[10px] border border-border bg-surface py-2.5 pl-3 pr-10 text-sm text-primary outline-none focus:border-primary [color-scheme:light]"
      : "w-full rounded-xl border border-zinc-200 py-2.5 pl-3 pr-10 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 [color-scheme:light]";

  const labelClass =
    variant === "add"
      ? "mb-1.5 block text-xs font-semibold text-muted"
      : "mb-1 block text-sm font-medium text-zinc-700";

  const shortcuts = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "3 days", days: 3 },
  ];

  const getDateTimeKey = (days: number) => {
    const date = addDays(new Date(), days);

    // Set default time to current time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="relative">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />

        <CalendarDays
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {shortcuts.map((opt) => {
          const dateKey = getDateTimeKey(opt.days);

          const selected =
            value.split("T")[0] === dateKey.split("T")[0];

          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(dateKey)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotesField({
  value,
  onChange,
  minRows,
  placeholder,
  variant = "default",
}: {
  value: string;
  onChange: (v: string) => void;
  minRows: number;
  placeholder?: string;
  variant?: "default" | "add";
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const inputClass =
    variant === "add"
      ? "w-full resize-none overflow-hidden rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-primary outline-none focus:border-primary"
      : "w-full resize-none overflow-hidden rounded-xl border border-zinc-200 px-3 py-2.5 text-base leading-relaxed outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const labelClass =
    variant === "add"
      ? "mb-1.5 block text-xs font-semibold text-muted"
      : "mb-1 block text-sm font-medium text-zinc-700";

  return (
    <div>
      <label className={labelClass}>Notes</label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  variant = "default",
  className,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  variant?: "default" | "add";
  className?: string;
  error?: string;
}) {
  const inputClass =
    variant === "add"
      ? "w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
      : "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const labelClass =
    variant === "add"
      ? "mb-1.5 block text-xs font-semibold text-muted"
      : "mb-1 block text-sm font-medium text-zinc-700";

  return (
    <div className={className} data-field-error={error ? "true" : undefined}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, error && fieldErrorBorder)}
      />
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}
