import {
  PROPERTY_AREA_UNITS,
  type PropertyAreaUnit,
} from "@/lib/constants/property";

export type AreaUnit = PropertyAreaUnit;

export { PROPERTY_AREA_UNITS as areaUnits };

export function formatArea(amount: string, unit: AreaUnit): string {
  const trimmed = amount.trim();
  if (!trimmed) return "";
  const unitLabel =
    PROPERTY_AREA_UNITS.find((u) => u.id === unit)?.label ?? unit;
  return `${trimmed} ${unitLabel}`;
}

export function parseArea(value: string): { amount: string; unit: AreaUnit } {
  const v = value.trim().toLowerCase();
  if (!v) return { amount: "", unit: "sq-ft" };

  const cleaned = v.replace(/,/g, "").trim();

  const patterns: Array<{ unit: AreaUnit; regex: RegExp }> = [
    { unit: "sq-ft", regex: /^([\d.]+)\s*(sq\.?\s*ft|sqft|square feet|square foot)$/ },
    { unit: "sq-yd", regex: /^([\d.]+)\s*(sq\.?\s*yd|sqyd|square yards|square yard)$/ },
    { unit: "sq-m", regex: /^([\d.]+)\s*(sq\.?\s*m|sqm|square meters|square metre|square meter)$/ },
    { unit: "acre", regex: /^([\d.]+)\s*(acres|acre)$/ },
    { unit: "kanal", regex: /^([\d.]+)\s*(kanal|kanals)$/ },
    { unit: "marla", regex: /^([\d.]+)\s*(marla|marlas)$/ },
    { unit: "gaj", regex: /^([\d.]+)\s*(gaj|gajj)$/ },
  ];

  for (const { unit, regex } of patterns) {
    const match = cleaned.match(regex);
    if (match) return { amount: match[1], unit };
  }

  const numMatch = cleaned.match(/^([\d.]+)/);
  if (numMatch) {
    if (/sq\.?\s*ft|sqft|square feet|square foot/.test(cleaned)) {
      return { amount: numMatch[1], unit: "sq-ft" };
    }
    if (/sq\.?\s*yd|sqyd|square yards|square yard/.test(cleaned)) {
      return { amount: numMatch[1], unit: "sq-yd" };
    }
    if (/sq\.?\s*m|sqm|square meters|square metre|square meter/.test(cleaned)) {
      return { amount: numMatch[1], unit: "sq-m" };
    }
    if (/acres|acre/.test(cleaned)) return { amount: numMatch[1], unit: "acre" };
    if (/kanal/.test(cleaned)) return { amount: numMatch[1], unit: "kanal" };
    if (/marla/.test(cleaned)) return { amount: numMatch[1], unit: "marla" };
    if (/gaj/.test(cleaned)) return { amount: numMatch[1], unit: "gaj" };

    for (const { id, label } of PROPERTY_AREA_UNITS) {
      if (cleaned.includes(label.toLowerCase())) {
        return { amount: numMatch[1], unit: id };
      }
    }

    return { amount: numMatch[1], unit: "sq-ft" };
  }

  return { amount: "", unit: "sq-ft" };
}
