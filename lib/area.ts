import {
  PROPERTY_AREA_UNITS,
  type PropertyAreaUnit,
} from "@/lib/constants/property";

export type AreaUnit = PropertyAreaUnit;

export { PROPERTY_AREA_UNITS as areaUnits };

/** Square feet in one unit. Punjab/Chandigarh: 1 gaj = 9 sq.ft, 1 marla = 272.25 sq.ft, 1 kanal = 20 marla. */
const SQFT_PER_UNIT: Record<AreaUnit, number> = {
  "sq-ft": 1,
  "sq-yd": 9,
  "sq-m": 10.76391041671,
  acre: 43560,
  gaj: 9,
  marla: 272.25,
  kanal: 5445,
};

export function toSqft(amount: string, unit: AreaUnit): number | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value * SQFT_PER_UNIT[unit];
}

export function fromSqft(sqft: number, unit: AreaUnit): string {
  if (!Number.isFinite(sqft)) return "";
  return formatAmount(sqft / SQFT_PER_UNIT[unit]);
}

export function convertAreaAmount(amount: string, from: AreaUnit, to: AreaUnit): string {
  if (!amount.trim() || from === to) return amount;
  const sqft = toSqft(amount, from);
  if (sqft == null) return amount;
  return fromSqft(sqft, to);
}

function formatAmount(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
  return rounded.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

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
