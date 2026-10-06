"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { amountInWords } from "@/lib/price";
import {
  PARKING_TYPE_OPTIONS,
  POSSESSION_OPTIONS,
  SHOP_WASHROOM_OPTIONS,
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

export function RetailShopMallProfile({
  form,
  onChange,
  areaError,
  priceError,
  rentError,
}: {
  form: ListingDraft;
  onChange: ListingChange;
  areaError?: string;
  priceError?: string;
  rentError?: string;
}) {
  const [morePrice, setMorePrice] = useState(
    Boolean(form.maintenance.trim() || form.bookingAmount.trim()),
  );
  const [leaseExtras, setLeaseExtras] = useState(
    Boolean(form.annualRentIncrement.trim() || form.leasedTo.trim()),
  );
  const words = amountInWords(form.price);
  const perFoot = pricePerSqFt(form.price, form.carpetArea || form.builtUpArea || form.plotArea);

  return (
    <>
      <div data-field-error={areaError ? "true" : undefined}>
        <SectionMessage title="Add Area Details" hint="Carpet area is mandatory." />
        <div className="mt-3 space-y-3">
          <AreaMeasureField
            label="Carpet Area"
            value={form.carpetArea}
            onChange={(value) => onChange("carpetArea", value)}
          />
          {form.shopLocation === "commercial-project" && (
            <AreaMeasureField
              label="Plot Area"
              value={form.plotArea}
              onChange={(value) => onChange("plotArea", value)}
            />
          )}
          <AreaMeasureField
            label="Built-up Area"
            value={form.builtUpArea}
            onChange={(value) => onChange("builtUpArea", value)}
          />
        </div>
        {areaError ? <FieldMessage>{areaError}</FieldMessage> : null}
      </div>

      <Choices
        label="Washroom details"
        value={form.shopWashroom}
        options={SHOP_WASHROOM_OPTIONS}
        onChange={(value) => onChange("shopWashroom", value)}
      />

      <div>
        <SectionMessage
          title="Floor Details (Optional)"
          hint="Total no. of floors and your floor details"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field
            label="Total floors"
            value={form.totalFloors}
            onChange={(value) => onChange("totalFloors", value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
          <PropertyFloorSelect
            label="Property on floor"
            value={form.propertyFloor}
            totalFloors={form.totalFloors}
            onChange={(value) => onChange("propertyFloor", value)}
          />
        </div>
      </div>

      <Choices
        label="Parking Type"
        value={form.parkingType}
        options={PARKING_TYPE_OPTIONS}
        onChange={(value) => onChange("parkingType", value)}
      />

      <Choices
        label="Availability Status"
        value={form.possession}
        options={POSSESSION_OPTIONS}
        onChange={(value) => onChange("possession", value)}
        columns={2}
      />

      <div>
        <SectionMessage title="Shop facade size (Optional)" hint="Shop-front related details" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field
            label="Entrance width (ft.)"
            value={form.entranceWidth}
            onChange={(value) => onChange("entranceWidth", value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
          />
          <Field
            label="Ceiling height (ft.)"
            value={form.ceilingHeight}
            onChange={(value) => onChange("ceilingHeight", value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
          />
        </div>
      </div>

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
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setMorePrice((open) => !open)}
            className="text-sm font-medium text-primary"
          >
            {morePrice ? "Hide maintenance and booking amount" : "Add Maintenance and Booking Amount"}
          </button>
          {morePrice && (
            <div className="space-y-3">
              <Field
                label="Maintenance"
                value={form.maintenance}
                onChange={(value) => onChange("maintenance", value)}
                placeholder="Monthly charges"
              />
              <Field
                label="Booking amount"
                value={rentDigits(form.bookingAmount)}
                onChange={(value) => onChange("bookingAmount", formatRent(value))}
                inputMode="numeric"
              />
            </div>
          )}
        </div>
      </div>

      <Choices
        label="Is it Pre-leased / Pre-Rented?"
        hint="For properties that are already rented out"
        value={form.preLeased}
        options={YES_NO_OPTIONS}
        onChange={(value) => {
          onChange("preLeased", value);
          if (value !== "yes") {
            onChange("currentRent", "");
            onChange("leaseTenure", "");
            onChange("annualRentIncrement", "");
            onChange("leasedTo", "");
            setLeaseExtras(false);
          }
        }}
        columns={2}
      />

      {form.preLeased === "yes" && (
        <div>
          <SectionMessage
            title="Pre-leased / Pre-Rented Details"
            hint="Lease / Rent related details of your property"
          />
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
                  placeholder="Current rent per month"
                  aria-label="Current rent per month"
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
              inputMode="numeric"
              value={form.leaseTenure}
              placeholder="Lease tenure in years"
              aria-label="Lease tenure in years"
              onChange={(e) => onChange("leaseTenure", e.target.value.replace(/[^\d]/g, ""))}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setLeaseExtras((open) => !open)}
              className="text-sm font-medium text-primary"
            >
              {leaseExtras
                ? "Hide annual rent increment & leased to"
                : "+ Add Annual Rent Increment & Leased to"}
            </button>
            {leaseExtras && (
              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.annualRentIncrement}
                  placeholder="Annual rent increment"
                  aria-label="Annual rent increment"
                  onChange={(e) => onChange("annualRentIncrement", e.target.value)}
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
