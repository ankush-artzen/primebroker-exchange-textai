"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { User } from "@/lib/types";
import { api } from "@/lib/api";
import { getStoredUserId, setStoredUser } from "@/lib/storage";
import {
  fieldErrorBorder,
  fieldErrorText,
  formErrorBanner,
  formatMissingFieldsSummary,
  scrollToFirstFieldError,
} from "@/lib/form-errors";
import { cn, isValidIndianPhone, isValidPersonName, sanitizePersonName } from "@/lib/utils";
import { Camera } from "lucide-react";
import { ButtonLoader, Spinner } from "@/components/Loader";
import { PhoneField } from "@/components/PhoneField";
import { UserAvatar } from "./UserAvatar";

interface Props {
  user: User;
  onUpdated: (user: User) => void;
}

type ProfileField = "name" | "phone";

function mapApiError(message: string): Partial<Record<ProfileField, string>> {
  const lower = message.toLowerCase();
  if (lower.includes("phone")) return { phone: message };
  if (lower.includes("name")) return { name: message };
  return {};
}

export function ProfileForm({ user, onUpdated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [avatarUrl, setAvatarUrl] = useState(user.profilePictureUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ProfileField, string>>
  >({});

  const clearFieldError = (field: ProfileField) => {
    setFieldErrors((errors) => {
      if (!errors[field]) return errors;
      const next = { ...errors };
      delete next[field];
      return next;
    });
    if (error) setError("");
  };

  const validate = () => {
    const errors: Partial<Record<ProfileField, string>> = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (!isValidPersonName(name)) {
      errors.name = "Name can only contain letters";
    }
    if (!phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!isValidIndianPhone(phone)) {
      errors.phone = "Enter a valid 10-digit mobile number";
    }

    return errors;
  };

  const handlePhoto = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const { urls } = await api.uploadPhotos([file]);
      setAvatarUrl(urls[0] ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const labels: Record<ProfileField, string> = {
        name: "Name",
        phone: "Phone",
      };
      setError(
        formatMissingFieldsSummary(
          Object.keys(errors).map((key) => labels[key as ProfileField]),
        ),
      );
      scrollToFirstFieldError();
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        profilePictureUrl: avatarUrl || null,
      });

      const userId = getStoredUserId();
      if (userId) {
        setStoredUser(userId, {
          name: updated.name,
          phone: updated.phone,
          profilePictureUrl: updated.profilePictureUrl,
        });
      }

      onUpdated(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      const apiFieldErrors = mapApiError(message);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
        scrollToFirstFieldError();
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className={formErrorBanner}>{error}</p>}

      <div className="flex flex-col items-center">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="relative"
          aria-label="Change profile picture"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <UserAvatar name={name} size={96} />
          )}
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground">
            {uploading ? (
              <Spinner size={16} className="text-current" />
            ) : (
              <Camera size={16} />
            )}
          </span>
        </button>
        <p className="mt-2 text-[12.5px] text-muted">Tap to change photo</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhoto(e.target.files)}
        />
      </div>

      <Field
        label="Name"
        value={name}
        onChange={(value) => {
          setName(sanitizePersonName(value));
          clearFieldError("name");
        }}
        placeholder="Your name"
        error={fieldErrors.name}
      />
      <PhoneField
        value={phone}
        onChange={(value) => {
          setPhone(value);
          clearFieldError("phone");
        }}
        label="Phone"
        variant="add"
        error={fieldErrors.phone}
      />

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {saving ? <ButtonLoader label="Saving…" /> : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <label className="mb-1.5 block text-xs font-semibold text-muted">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary",
          error && fieldErrorBorder,
        )}
      />
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}
