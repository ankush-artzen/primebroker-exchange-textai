"use client";

import { amountInWords } from "@/lib/price";
import {
  BUILDER_FLOOR_AGE_OPTIONS,
  BUILDER_FLOOR_BALCONY_OPTIONS,
  BUILDER_FLOOR_TYPES,
  POSSESSION_BY_OPTIONS,
  POSSESSION_OPTIONS,
} from "@/lib/constants/property";
import { AreaMeasureField, SqYardField } from "@/components/property-form/area";
import {
  Choices,
  Field,
  PropertyFloorSelect,
  RoomCount,
  SelectField,
} from "@/components/property-form/fields";
import { PriceOptionFields } from "@/components/property-form/price-options";
import { formatRent, pricePerSqYard, rentDigits } from "@/components/property-form/helpers";
import { SectionMessage } from "@/components/property-form/messages";
import type { ListingChange, ListingDraft } from "@/components/property-form/types";

export function ResidentialBuilderFloorProfile({
  form,
  onChange,
  onPossession,
  priceError,
}: {
  form: ListingDraft;
  onChange: ListingChange;
  onPossession: (value: string) => void;
  priceError?: string;
}) {
  const underConstruction = form.possession === "under-construction";
  const words = amountInWords(form.price);
  const perYard = pricePerSqYard(form.price, form.plotArea);

  return (
    <>
      <Choices
        label="Select the type of builder floor"
        value={form.configuration}
        options={BUILDER_FLOOR_TYPES}
        onChange={(value) => onChange("configuration", value)}
      />

      <div>
        <SectionMessage title="Floor Details" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field
            label="Total Floors"
            value={form.totalFloors}
            onChange={(value) => onChange("totalFloors", value)}
            type="number"
            inputMode="numeric"
          />
          <PropertyFloorSelect
            label="Property on Floor"
            value={form.propertyFloor}
            totalFloors={form.totalFloors}
            onChange={(value) => onChange("propertyFloor", value)}
          />
        </div>
      </div>

      <div>
        <SectionMessage title="Add Area Details" />
        <div className="mt-3 space-y-4">
          <SqYardField
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
          <AreaMeasureField
            label="Super Built-up Area"
            value={form.superBuiltUpArea}
            onChange={(value) => onChange("superBuiltUpArea", value)}
          />
        </div>
      </div>

      <div>
        <SectionMessage title="Add Room Details" />
        <div className="mt-3 space-y-4">
          <RoomCount
            label="No. of Bedrooms"
            value={form.bedrooms}
            maxChip={4}
            otherLabel="+ Add others"
            onChange={(value) => onChange("bedrooms", value)}
          />
          <RoomCount
            label="No. of Bathrooms"
            value={form.bathrooms}
            maxChip={4}
            otherLabel="+ Add others"
            onChange={(value) => onChange("bathrooms", value)}
          />
          <Choices
            label="Balconies"
            value={form.balconies}
            options={BUILDER_FLOOR_BALCONY_OPTIONS}
            onChange={(value) => onChange("balconies", value)}
          />
        </div>
      </div>

      <Choices
        label="Availability Status"
        value={form.possession}
        options={POSSESSION_OPTIONS}
        onChange={onPossession}
        columns={2}
      />

      {!underConstruction && (
        <Choices
          label="Age of Property"
          value={form.propertyAge}
          options={BUILDER_FLOOR_AGE_OPTIONS}
          onChange={(value) => onChange("propertyAge", value)}
        />
      )}

      {underConstruction && (
        <SelectField
          label="Possession By"
          value={form.possessionBy}
          onChange={(value) => onChange("possessionBy", value)}
          options={POSSESSION_BY_OPTIONS}
          placeholder="Expected by"
        />
      )}

      <div data-field-error={priceError ? "true" : undefined}>
        <SectionMessage title="Price Details" />
        <div className="mt-3 space-y-4">
          <Field
            label="Expected Price"
            value={rentDigits(form.price)}
            onChange={(value) => onChange("price", formatRent(value))}
            placeholder="Expected Price"
            type="number"
            inputMode="numeric"
            error={priceError}
          />
          {words && <p className="-mt-2 text-[12px] text-muted">{words}</p>}
          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground">
              {underConstruction ? "₹ Price per sq.yards" : "Price per sq. yards"}
            </p>
            <p className="rounded-xl border border-border bg-background px-3 py-2.5 text-base text-muted">
              {perYard || "—"}
            </p>
          </div>
          <PriceOptionFields form={form} onChange={onChange} />
        </div>
      </div>
    </>
  );
}
