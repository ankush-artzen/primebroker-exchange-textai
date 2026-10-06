"use client";

import { useState } from "react";
import { CheckField, fieldClass } from "@/components/property-form/fields";
import type { ListingChange, ListingDraft } from "@/components/property-form/types";

export function PriceOptionFields({
  form,
  onChange,
}: {
  form: ListingDraft;
  onChange: ListingChange;
}) {
  const [morePrice, setMorePrice] = useState(Boolean(form.priceDetails.trim()));

  const setPriceFlag = (field: "allInclusive" | "chargesExcluded", checked: boolean) => {
    onChange(field, checked);
    if (checked) onChange(field === "allInclusive" ? "chargesExcluded" : "allInclusive", false);
  };

  return (
    <div className="mt-4 space-y-3">
      <CheckField
        label="All inclusive price"
        checked={form.allInclusive}
        onChange={(checked) => setPriceFlag("allInclusive", checked)}
      />
      <CheckField
        label="Tax and other charges excluded"
        checked={form.chargesExcluded}
        onChange={(checked) => setPriceFlag("chargesExcluded", checked)}
      />
      {/* <CheckField
        label="DG & UPS Power Backup Included"
        checked={form.dgUpsIncluded}
        onChange={(checked) => onChange("dgUpsIncluded", checked)}
      /> */}
      <CheckField
        label="Price Negotiable"
        checked={form.negotiable}
        onChange={(checked) => onChange("negotiable", checked)}
      />
      <button
        type="button"
        onClick={() => setMorePrice((open) => !open)}
        className="text-sm font-medium text-primary"
      >
        {morePrice ? "Hide pricing details" : "Add more pricing details"}
      </button>
      {morePrice && (
        <textarea
          value={form.priceDetails}
          onChange={(e) => onChange("priceDetails", e.target.value)}
          rows={3}
          placeholder="Booking amount, dues, or other charges"
          className={fieldClass}
        />
      )}
    </div>
  );
}
