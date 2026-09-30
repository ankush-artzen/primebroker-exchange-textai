"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { PropertyFormData } from "@/lib/types";
import { LocationPicker } from "@/components/LocationPicker";
import { PriceField } from "@/components/PriceField";
import { AreaField } from "@/components/AreaField";
import {
  getConfigurationOptions,
  PROPERTY_AVAILABILITY_OPTIONS,
} from "@/lib/constants/property";
import {
  fieldErrorBorder,
  fieldErrorText,
  formatMissingFieldsSummary,
  scrollToFirstFieldError,
  formErrorBanner,
} from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { ButtonLoader, Spinner } from "@/components/Loader";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";

const emptyProperty: PropertyFormData = {
  title: "",
  location: "",
  price: "",
  configuration: "",
  area: "",
  availability: "available",
  notes: "",
  photoUrls: [],
};

interface Props {
  initial?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function PropertyForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Property",
}: Props) {
  type PropertyField = "title" | "location" | "price";

  const [form, setForm] = useState<PropertyFormData>({
    ...emptyProperty,
    ...initial,
    photoUrls: initial?.photoUrls ?? [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PropertyField, string>>
  >({});
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof PropertyFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field in fieldErrors) {
      setFieldErrors((errors) => {
        const next = { ...errors };
        delete next[field as PropertyField];
        return next;
      });
    }
    if (error) setError("");
  };

  const validate = () => {
    const errors: Partial<Record<PropertyField, string>> = {};

    if (!form.title.trim()) {
      errors.title = "Property name is required";
    }
    if (!form.location.trim()) {
      errors.location = "Location is required";
    }
    if (!form.price.trim()) {
      errors.price = "Price is required";
    }

    return errors;
  };

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const { urls } = await api.uploadPhotos(Array.from(files));
      setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setForm((f) => ({
      ...f,
      photoUrls: f.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const labels: Record<PropertyField, string> = {
        title: "Property Name",
        location: "Location",
        price: "Price",
      };
      setError(
        formatMissingFieldsSummary(
          Object.keys(errors).map((key) => labels[key as PropertyField]),
        ),
      );
      scrollToFirstFieldError();
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className={formErrorBanner}>{error}</p>}

      <Field
        label="Property Name *"
        value={form.title}
        onChange={(v) => update("title", v)}
        error={fieldErrors.title}
      />
      <LocationPicker
        value={form.location}
        onChange={(v) => update("location", v)}
        error={fieldErrors.location}
      />
      <PriceField
        value={form.price}
        onChange={(v) => update("price", v)}
        error={fieldErrors.price}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Configuration
        </label>
        <select
          value={form.configuration ?? ""}
          onChange={(e) => update("configuration", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Select configuration</option>
          {getConfigurationOptions(form.configuration).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <AreaField value={form.area ?? ""} onChange={(v) => update("area", v)} />
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Availability</label>
        <select
          value={form.availability ?? "available"}
          onChange={(e) => update("availability", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {PROPERTY_AVAILABILITY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Photos</label>
        <div className="flex flex-wrap gap-2">
          {form.photoUrls.map((url, i) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg">
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1.5 text-xs text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-2xl text-zinc-400"
          >
            {uploading ? (
              <Spinner size={24} className="text-muted" />
            ) : (
              <Plus size={24} />
            )}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handlePhotos(e.target.files)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Notes</label>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-zinc-200 py-3 font-medium text-zinc-700">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? <ButtonLoader label="Saving…" /> : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
          error && fieldErrorBorder,
        )}
      />
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}
