"use client";

import {
  RESIDENTIAL_LISTING_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
  propertyTypeLabel,
} from "@/lib/constants/property";
import { Choices } from "@/components/property-form/fields";
import type { ListingDraft } from "@/components/property-form/types";

export function ResidentialDetails({
  form,
  intentError,
  typeError,
  onIntent,
  onType,
}: {
  form: ListingDraft;
  intentError?: string;
  typeError?: string;
  onIntent: (value: string) => void;
  onType: (value: string) => void;
}) {
  const typeOptions =
    !form.propertyType ||
    RESIDENTIAL_PROPERTY_TYPES.some((option) => option.id === form.propertyType)
      ? RESIDENTIAL_PROPERTY_TYPES
      : [
          {
            id: form.propertyType,
            label: propertyTypeLabel("residential", form.propertyType),
          },
          ...RESIDENTIAL_PROPERTY_TYPES,
        ];

  return (
    <>
      <Choices
        label="Listing type *"
        value={form.intent}
        options={RESIDENTIAL_LISTING_TYPES}
        onChange={onIntent}
        error={intentError}
        columns={2}
      />
      <Choices
        label="Property type *"
        value={form.propertyType}
        options={typeOptions}
        onChange={onType}
        error={typeError}
      />
    </>
  );
}
