"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { amountInWords } from "@/lib/price";
import {
  APARTMENT_BHK_OPTIONS,
  BALCONY_OPTIONS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  BUILDER_FLOOR_AGE_OPTIONS,
  FACING_OPTIONS,
  FLOORING_OPTIONS,
  RENT_FURNISHING_OPTIONS,
  OWNERSHIP_OPTIONS,
  POSSESSION_BY_OPTIONS,
  POSSESSION_OPTIONS,
  POWER_BACKUP_OPTIONS,
  amenityOptions,
} from "@/lib/constants/property";
import { cn } from "@/lib/utils";
import { AreaFields } from "@/components/property-form/area";
import {
  Choices,
  CountStepper,
  MultiChoices,
  PropertyFloorSelect,
  SelectField,
  fieldClass,
} from "@/components/property-form/fields";
import { formatRent, pricePerSqFt, rentDigits } from "@/components/property-form/helpers";
import { SectionMessage } from "@/components/property-form/messages";
import { PriceOptionFields } from "@/components/property-form/price-options";
import type { ListingChange, ListingDraft } from "@/components/property-form/types";

export function ResidentialProfile({
  form,
  onBedrooms,
  onChange,
  onToggleAmenity,
  priceError,
}: {
  form: ListingDraft;
  onBedrooms: (value: string) => void;
  onChange: ListingChange;
  onToggleAmenity: (id: string) => void;
  priceError?: string;
}) {
  const words = amountInWords(form.price);
  const perFoot = pricePerSqFt(
    form.price,
    form.builtUpArea || form.carpetArea || form.plotArea,
  );
  const apartmentSale = form.category === "residential" && form.intent !== "rent" && form.propertyType === "flat";
  const presetApartment = APARTMENT_BHK_OPTIONS.some(
    (option) => option.id !== "other" && option.id === form.configuration,
  );
  const otherBhk = /^\d+ BHK$/.test(form.configuration) && !presetApartment;
  const [otherApartment, setOtherApartment] = useState(otherBhk);
  const apartmentValue = presetApartment ? form.configuration : otherApartment || otherBhk ? "other" : "";

  const chooseApartment = (value: string) => {
    if (value === "other") {
      setOtherApartment(true);
      if (presetApartment) onChange("configuration", "");
      return;
    }
    setOtherApartment(false);
    onChange("configuration", value);
    onBedrooms(value.replace(" BHK", ""));
  };

  return (
    <>
      {apartmentSale && (
        <div>
          <Choices
            label="Your apartment is a"
            value={apartmentValue}
            options={APARTMENT_BHK_OPTIONS}
            onChange={chooseApartment}
          />
          {(otherApartment || otherBhk) && (
            <input
              type="text"
              inputMode="numeric"
              value={otherBhk ? form.configuration.replace(" BHK", "") : ""}
              placeholder="BHK"
              aria-label="Other BHK"
              onChange={(e) => {
                const count = e.target.value.replace(/[^\d]/g, "");
                if (count === "3" || count === "4" || count === "5" || count === "6") {
                  setOtherApartment(false);
                }
                onChange("configuration", count ? `${count} BHK` : "");
                if (count) onBedrooms(count);
              }}
              className={cn(fieldClass, "mt-2")}
            />
          )}
        </div>
      )}
      <AreaFields
        carpetArea={form.carpetArea}
        plotArea={form.plotArea}
        builtUpArea={form.builtUpArea}
        onChange={onChange}
      />
      <Choices
        label="Bedrooms"
        value={form.bedrooms}
        options={BEDROOM_OPTIONS}
        onChange={onBedrooms}
        columns={5}
      />
      <Choices
        label="Bathrooms"
        value={form.bathrooms}
        options={BATHROOM_OPTIONS}
        onChange={(value) => onChange("bathrooms", value)}
        columns={4}
      />
      <Choices
        label="Balconies"
        value={form.balconies}
        options={BALCONY_OPTIONS}
        onChange={(value) => onChange("balconies", value)}
        columns={4}
      />
      <div>
        <SectionMessage
          title="Floor Details"
          hint="Total no of floors and your floor details"
          className="mb-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.totalFloors}
            placeholder="Total floors"
            onChange={(e) => onChange("totalFloors", e.target.value)}
            className={fieldClass}
          />
          <PropertyFloorSelect
            value={form.propertyFloor}
            totalFloors={form.totalFloors}
            placeholder="Property on floor"
            onChange={(value) => onChange("propertyFloor", value)}
          />
        </div>
      </div>
      <Choices
        label="Availability Status"
        value={form.possession}
        options={POSSESSION_OPTIONS}
        onChange={(value) => onChange("possession", value)}
        columns={2}
      />

      {form.possession !== "under-construction" && (
        <Choices
          label="Age of Property"
          value={form.propertyAge}
          options={BUILDER_FLOOR_AGE_OPTIONS}
          onChange={(value) => onChange("propertyAge", value)}
        />
      )}

      {form.possession === "under-construction" && (
        <SelectField
          label="Possession By"
          value={form.possessionBy}
          onChange={(value) => onChange("possessionBy", value)}
          options={POSSESSION_BY_OPTIONS}
          placeholder="Expected by"
        />
      )}
      {form.propertyType === "studio" && (
        <Choices
          label="Furnishing"
          value={form.furnishing}
          options={RENT_FURNISHING_OPTIONS}
          onChange={(value) => onChange("furnishing", value)}
        />
      )}
      <Choices
        label="Facing"
        value={form.facing}
        options={FACING_OPTIONS}
        onChange={(value) => onChange("facing", value)}
        columns={4}
      />
      <Choices
        label="Power backup"
        value={form.powerBackup}
        options={POWER_BACKUP_OPTIONS}
        onChange={(value) => onChange("powerBackup", value)}
      />
      <div>
        <p className="mb-2 text-[13px] font-medium text-foreground">Reserved parking</p>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <CountStepper
            label="Covered"
            value={form.coveredParking}
            onChange={(value) => onChange("coveredParking", value)}
          />
          <CountStepper
            label="Open"
            value={form.openParking}
            onChange={(value) => onChange("openParking", value)}
            divided
          />
        </div>
      </div>
      <Choices
        label="Ownership"
        value={form.ownership}
        options={OWNERSHIP_OPTIONS}
        onChange={(value) => onChange("ownership", value)}
      />
      <SelectField
        label="Flooring"
        value={form.flooring}
        onChange={(value) => onChange("flooring", value)}
        options={FLOORING_OPTIONS}
        placeholder="Select flooring"
      />
      <MultiChoices
        label="Amenities"
        values={form.amenities}
        options={amenityOptions("residential")}
        onToggle={onToggleAmenity}
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
            {perFoot || "₹ Price per sq.ft."}
          </p>
        </div>
        <PriceOptionFields form={form} onChange={onChange} />
      </div>
    </>
  );
}
