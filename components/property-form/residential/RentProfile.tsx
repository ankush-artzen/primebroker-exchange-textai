"use client";

import { useState } from "react";
import { amountInWords } from "@/lib/price";
import {
  RENT_AGE_OPTIONS,
  RENT_BALCONY_OPTIONS,
  RENT_FURNISHING_OPTIONS,
  RENT_TENANT_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/constants/property";
import { AreaMeasureField } from "@/components/property-form/area";
import {
  Choices,
  Field,
  MultiChoices,
  PropertyFloorSelect,
  RoomCount,
} from "@/components/property-form/fields";
import { PriceOptionFields } from "@/components/property-form/price-options";
import { formatRent, rentDigits } from "@/components/property-form/helpers";
import { FieldMessage, SectionMessage } from "@/components/property-form/messages";
import type { ListingChange, ListingDraft } from "@/components/property-form/types";

export function RentProfile({
  form,
  onBedrooms,
  onChange,
  areaError,
  priceError,
}: {
  form: ListingDraft;
  onBedrooms: (value: string) => void;
  onChange: ListingChange;
  areaError?: string;
  priceError?: string;
}) {
  const [moreRent, setMoreRent] = useState(Boolean(form.deposit.trim() || form.maintenance.trim()));
  const words = amountInWords(form.price);

  const toggleTenant = (id: string) => {
    const selected = form.preferredTenants.includes(id);
    if (id === "anyone") {
      onChange("preferredTenants", selected ? [] : ["anyone"]);
      return;
    }
    const next = selected
      ? form.preferredTenants.filter((item) => item !== id)
      : [...form.preferredTenants.filter((item) => item !== "anyone"), id];
    onChange("preferredTenants", next);
  };

  return (
    <>
      <div data-field-error={areaError ? "true" : undefined}>
        <SectionMessage
          title="Add Area Details"
          hint="At least one area type is mandatory."
        />
        <div className="mt-3 space-y-4">
          <AreaMeasureField
            label="Plot Area"
            value={form.plotArea}
            onChange={(value) => onChange("plotArea", value)}
          />
          <AreaMeasureField
            label="Carpet Area"
            value={form.carpetArea}
            onChange={(value) => onChange("carpetArea", value)}
          />
          <AreaMeasureField
            label="Built-up Area"
            value={form.builtUpArea}
            onChange={(value) => onChange("builtUpArea", value)}
          />
        </div>
        {areaError && <FieldMessage>{areaError}</FieldMessage>}
      </div>

      <div>
        <SectionMessage title="Add Room Details" />
        <div className="mt-3 space-y-4">
          <RoomCount
            label="No. of Bedrooms"
            value={form.bedrooms}
            maxChip={4}
            onChange={onBedrooms}
          />
          <RoomCount
            label="No. of Bathrooms"
            value={form.bathrooms}
            maxChip={4}
            onChange={(value) => onChange("bathrooms", value)}
          />
          <Choices
            label="Balconies"
            value={form.balconies}
            options={RENT_BALCONY_OPTIONS}
            onChange={(value) => onChange("balconies", value)}
          />
        </div>
      </div>

      <Choices
        label="Furnishing"
        value={form.furnishing}
        options={RENT_FURNISHING_OPTIONS}
        onChange={(value) => onChange("furnishing", value)}
      />

      <div>
        <SectionMessage
          title="Floor Details"
          hint="Total no of floors and your floor details."
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field
            label="Total floors"
            value={form.totalFloors}
            onChange={(value) => onChange("totalFloors", value)}
            type="number"
            inputMode="numeric"
          />
          <PropertyFloorSelect
            label="Your floor"
            value={form.propertyFloor}
            totalFloors={form.totalFloors}
            onChange={(value) => onChange("propertyFloor", value)}
          />
        </div>
      </div>

      <Choices
        label="Age of property"
        value={form.propertyAge}
        options={RENT_AGE_OPTIONS}
        onChange={(value) => onChange("propertyAge", value)}
      />

      <Field
        label="Available from"
        value={form.availableFrom}
        onChange={(value) => onChange("availableFrom", value)}
        type="date"
      />

      <MultiChoices
        label="Willing to rent out to"
        values={form.preferredTenants}
        options={RENT_TENANT_OPTIONS}
        onToggle={toggleTenant}
      />

      <div data-field-error={priceError ? "true" : undefined}>
        <SectionMessage title="Rent Details" />
        <div className="mt-3">
          <Field
            label="Price (Monthly per flat) *"
            value={rentDigits(form.price)}
            onChange={(value) => onChange("price", formatRent(value))}
            placeholder="Expected Rent"
            type="number"
            inputMode="numeric"
            error={priceError}
          />
          {words && <p className="mt-1.5 text-[12px] text-muted">{words}</p>}
        </div>
        <PriceOptionFields form={form} onChange={onChange} />
        <button
          type="button"
          onClick={() => setMoreRent((open) => !open)}
          className="mt-3 text-sm font-medium text-primary"
        >
          {moreRent ? "Hide rent details" : "+ Add more Rent details"}
        </button>
        {moreRent && (
          <div className="mt-3 space-y-4">
            <Field
              label="Security deposit"
              value={form.deposit}
              onChange={(value) => onChange("deposit", value)}
              placeholder="e.g. 2 months"
            />
            <Field
              label="Maintenance"
              value={form.maintenance}
              onChange={(value) => onChange("maintenance", value)}
              placeholder="Monthly charges"
            />
          </div>
        )}
      </div>

      <Choices
        label="Are you ok with brokers contacting you?"
        value={form.brokerContact}
        options={YES_NO_OPTIONS}
        onChange={(value) => onChange("brokerContact", value)}
        columns={2}
      />
    </>
  );
}
