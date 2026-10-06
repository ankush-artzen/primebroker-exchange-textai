"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatArea, fromSqft, parseArea, toSqft, type AreaUnit } from "@/lib/area";
import { FORM_AREA_UNITS, type FormAreaUnit } from "@/lib/constants/property";

function formAreaUnit(unit: AreaUnit): FormAreaUnit {
  if (unit === "gaj" || unit === "sq-yd") return "gaj";
  if (unit === "marla" || unit === "kanal") return unit;
  return "sq-ft";
}

export function AreaMeasureField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseArea(value);
  const [unit, setUnit] = useState<FormAreaUnit>(formAreaUnit(parsed.unit));
  const sqftRef = useRef<number | null>(null);

  useEffect(() => {
    const next = parseArea(value);
    if (!next.amount) return;
    const nextUnit = formAreaUnit(next.unit);
    const amount =
      next.unit === "sq-yd" || nextUnit === next.unit
        ? next.amount
        : fromSqft(toSqft(next.amount, next.unit) ?? 0, nextUnit);
    setUnit(nextUnit);
    const sqft = toSqft(amount, nextUnit);
    if (sqft != null && (sqftRef.current == null || Math.abs(sqftRef.current - sqft) > 0.5)) {
      sqftRef.current = sqft;
    }
  }, [value]);

  const displayAmount = (() => {
    if (!parsed.amount) return "";
    if (formAreaUnit(parsed.unit) === unit && (parsed.unit === unit || parsed.unit === "sq-yd")) {
      return parsed.amount;
    }
    const sqft = sqftRef.current ?? toSqft(parsed.amount, parsed.unit);
    return sqft == null ? parsed.amount : fromSqft(sqft, unit);
  })();

  const writeAmount = (amount: string) => {
    sqftRef.current = toSqft(amount, unit);
    onChange(formatArea(amount, unit));
  };

  const writeUnit = (nextUnit: FormAreaUnit) => {
    if (nextUnit === unit) return;
    const sqft = sqftRef.current ?? (parsed.amount ? toSqft(parsed.amount, parsed.unit) : null);
    setUnit(nextUnit);
    if (sqft == null || !parsed.amount) return;
    sqftRef.current = sqft;
    onChange(formatArea(fromSqft(sqft, nextUnit), nextUnit));
  };

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      <input
        type="text"
        inputMode="decimal"
        value={displayAmount}
        placeholder={label}
        aria-label={label}
        onChange={(e) => writeAmount(e.target.value.replace(/[^\d.]/g, ""))}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-muted"
      />
      <div className="w-px shrink-0 bg-border" />
      <div className="relative shrink-0">
        <select
          value={unit}
          aria-label={`${label} unit`}
          onChange={(e) => writeUnit(e.target.value as FormAreaUnit)}
          className="h-full appearance-none bg-transparent py-3 pl-3 pr-8 text-base text-foreground outline-none"
        >
          {FORM_AREA_UNITS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id === "sq-ft" ? "sq.ft." : option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}

export function AreaFields({
  carpetArea,
  plotArea,
  builtUpArea,
  onChange,
}: {
  carpetArea: string;
  plotArea: string;
  builtUpArea: string;
  onChange: <K extends "carpetArea" | "plotArea" | "builtUpArea">(field: K, value: string) => void;
}) {
  return (
    <>
      <AreaMeasureField
        label="Carpet Area"
        value={carpetArea}
        onChange={(value) => onChange("carpetArea", value)}
      />
      <AreaMeasureField
        label="Plot Area"
        value={plotArea}
        onChange={(value) => onChange("plotArea", value)}
      />
      <AreaMeasureField
        label="Built-up Area"
        value={builtUpArea}
        onChange={(value) => onChange("builtUpArea", value)}
      />
    </>
  );
}

export function SqYardField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseArea(value);
  const display = (() => {
    if (!parsed.amount) return "";
    if (parsed.unit === "sq-yd" || parsed.unit === "gaj") return parsed.amount;
    const sqft = toSqft(parsed.amount, parsed.unit);
    return sqft == null ? parsed.amount : fromSqft(sqft, "sq-yd");
  })();

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      <input
        type="text"
        inputMode="decimal"
        value={display}
        placeholder={label}
        aria-label={label}
        onChange={(e) => onChange(formatArea(e.target.value.replace(/[^\d.]/g, ""), "sq-yd"))}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-muted"
      />
      <div className="w-px shrink-0 bg-border" />
      <span className="flex items-center px-3 text-base text-foreground">sq.yards</span>
    </div>
  );
}

export function SqFtField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseArea(value);
  const display = (() => {
    if (!parsed.amount) return "";
    if (parsed.unit === "sq-ft") return parsed.amount;
    const sqft = toSqft(parsed.amount, parsed.unit);
    return sqft == null ? parsed.amount : fromSqft(sqft, "sq-ft");
  })();

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      <input
        type="text"
        inputMode="decimal"
        value={display}
        placeholder={label}
        aria-label={label}
        onChange={(e) => onChange(formatArea(e.target.value.replace(/[^\d.]/g, ""), "sq-ft"))}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-foreground outline-none placeholder:text-muted"
      />
      <div className="w-px shrink-0 bg-border" />
      <span className="flex items-center px-3 text-base text-foreground">sq. ft.</span>
    </div>
  );
}
