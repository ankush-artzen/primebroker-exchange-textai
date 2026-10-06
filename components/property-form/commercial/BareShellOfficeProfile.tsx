"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { amountInWords } from "@/lib/price";
import {
  PANTRY_TYPES,
  POSSESSION_OPTIONS,
  PRESENCE_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/constants/property";
import { cn } from "@/lib/utils";
import { AreaMeasureField } from "@/components/property-form/area";
import {
  Choices,
  Field,
  PropertyFloorSelect,
  fieldClass,
} from "@/components/property-form/fields";
import { PriceOptionFields } from "@/components/property-form/price-options";
import { formatRent, pricePerSqFt, rentDigits } from "@/components/property-form/helpers";
import { FieldMessage, SectionMessage } from "@/components/property-form/messages";
import type { ListingChange, ListingDraft } from "@/components/property-form/types";

export function BareShellOfficeProfile({
  form,
  onChange,
  priceError,
  rentError,
}: {
  form: ListingDraft;
  onChange: ListingChange;
  priceError?: string;
  rentError?: string;
}) {
  const [moreLease, setMoreLease] = useState(
    Boolean(form.leaseTenure.trim() || form.leasedTo.trim()),
  );
  const words = amountInWords(form.price);
  const perFoot = pricePerSqFt(form.price, form.superBuiltUpArea || form.carpetArea);

  return (
    <>
      <div>
        <SectionMessage title="Add Area Details" />
        <div className="mt-3 space-y-3">
          <AreaMeasureField
            label="Super Built-up Area"
            value={form.superBuiltUpArea}
            onChange={(value) => onChange("superBuiltUpArea", value)}
          />
          <AreaMeasureField
            label="Carpet Area"
            value={form.carpetArea}
            onChange={(value) => onChange("carpetArea", value)}
          />
        </div>
      </div>

      <Choices
        label="Washrooms"
        value={form.washroomAvailability}
        options={PRESENCE_OPTIONS}
        onChange={(value) => onChange("washroomAvailability", value)}
        columns={2}
      />
      <Choices
        label="Pantry Type"
        value={form.pantryType}
        options={PANTRY_TYPES}
        onChange={(value) => onChange("pantryType", value)}
      />

      <div>
        <SectionMessage title="Please select the facilities available" />
        <div className="mt-3">
          <Choices
            label="Central Air Conditioning"
            value={form.centralAc}
            options={PRESENCE_OPTIONS}
            onChange={(value) => onChange("centralAc", value)}
            columns={2}
          />
        </div>
      </div>

      <div>
        <SectionMessage title="Floor Details" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field
            label="Total Floors"
            value={form.totalFloors}
            onChange={(value) => onChange("totalFloors", value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
          <PropertyFloorSelect
            label="Your Floor No. (Optional)"
            value={form.propertyFloor}
            totalFloors={form.totalFloors}
            onChange={(value) => onChange("propertyFloor", value)}
          />
        </div>
      </div>

      <Choices
        label="Lifts"
        value={form.lifts}
        options={PRESENCE_OPTIONS}
        onChange={(value) => onChange("lifts", value)}
        columns={2}
      />
      <Choices
        label="Parking"
        value={form.parkingAvailability}
        options={PRESENCE_OPTIONS}
        onChange={(value) => onChange("parkingAvailability", value)}
        columns={2}
      />

      <Choices
        label="Availability Status"
        value={form.possession}
        options={POSSESSION_OPTIONS}
        onChange={(value) => onChange("possession", value)}
        columns={2}
      />

      <div data-field-error={priceError ? "true" : undefined}>
        <SectionMessage title="Price Details" />
        <div className="mt-3 grid grid-cols-2 items-start gap-2">
          <div>
            <div
              className={cn(
                "rounded-xl border bg-background px-3 py-2.5",
                priceError
                  ? "border-red-500"
                  : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
              )}
            >
              {priceError ? (
                <p className="mb-0.5 text-[12px] leading-tight text-red-600">{priceError}</p>
              ) : null}
              <div className="flex items-center gap-1.5">
                <span className="text-base text-muted">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rentDigits(form.price)}
                  placeholder="Expected Price"
                  aria-label="Expected Price"
                  aria-invalid={priceError ? true : undefined}
                  onChange={(e) => onChange("price", formatRent(e.target.value))}
                  className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted/80"
                />
                {priceError ? (
                  <CircleAlert size={18} className="shrink-0 text-red-600" aria-hidden />
                ) : null}
              </div>
            </div>
            <p className={cn("mt-2 text-[13px]", words ? "text-foreground" : "text-muted")}>
              {words ? `₹ ${words}` : "₹ Price in words"}
            </p>
          </div>
          <p className="flex min-h-11 items-center rounded-xl border border-border bg-background px-3 py-2.5 text-base text-muted">
            {perFoot || "₹ Price per sq. ft."}
          </p>
        </div>
        <PriceOptionFields form={form} onChange={onChange} />
      </div>

      <Choices
        label="Is it Pre-Leased / Pre-Rented?"
        value={form.preLeased}
        options={YES_NO_OPTIONS}
        onChange={(value) => {
          onChange("preLeased", value);
          if (value !== "yes") {
            onChange("currentRent", "");
            onChange("annualRentIncrement", "");
            onChange("leaseTenure", "");
            onChange("leasedTo", "");
            setMoreLease(false);
          }
        }}
        columns={2}
      />

      {form.preLeased === "yes" && (
        <div>
          <SectionMessage title="Pre-leased / Pre-Rented Details" />
          <div className="mt-3 space-y-3">
            <div data-field-error={rentError ? "true" : undefined}>
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2.5",
                  rentError
                    ? "border-red-500"
                    : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
                )}
              >
                <span className="text-base text-muted">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rentDigits(form.currentRent)}
                  placeholder="Current rental per month"
                  aria-label="Current rental per month"
                  aria-invalid={rentError ? true : undefined}
                  onChange={(e) => onChange("currentRent", formatRent(e.target.value))}
                  className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted/80"
                />
                {rentError ? (
                  <CircleAlert size={18} className="shrink-0 text-red-600" aria-hidden />
                ) : null}
              </div>
              {rentError ? <FieldMessage>{rentError}</FieldMessage> : null}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={form.annualRentIncrement}
              placeholder="Increase in rent in years"
              aria-label="Increase in rent in years"
              onChange={(e) => onChange("annualRentIncrement", e.target.value)}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setMoreLease((open) => !open)}
              className="text-sm font-medium text-primary"
            >
              {moreLease ? "Hide lease and rental details" : "+ Add more lease and rental details"}
            </button>
            {moreLease && (
              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.leaseTenure}
                  placeholder="Lease tenure in years"
                  aria-label="Lease tenure in years"
                  onChange={(e) => onChange("leaseTenure", e.target.value.replace(/[^\d]/g, ""))}
                  className={fieldClass}
                />
                <input
                  type="text"
                  value={form.leasedTo}
                  placeholder="Leased to"
                  aria-label="Leased to"
                  onChange={(e) => onChange("leasedTo", e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
