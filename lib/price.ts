export type PriceUnit = "thousand" | "lakh" | "crore";

export const priceUnits: { id: PriceUnit; label: string }[] = [
  { id: "thousand", label: "Thousand" },
  { id: "lakh", label: "Lakh" },
  { id: "crore", label: "Crore" },
];

export function formatPrice(amount: string, unit: PriceUnit): string {
  const trimmed = amount.trim();
  if (!trimmed) return "";
  const unitLabel = priceUnits.find((u) => u.id === unit)?.label ?? unit;
  return `₹${trimmed} ${unitLabel}`;
}

export function parsePrice(value: string): { amount: string; unit: PriceUnit } {
  const v = value.trim().toLowerCase();
  if (!v) return { amount: "", unit: "lakh" };

  const cleaned = v.replace(/₹|,/g, "").trim();

  const crMatch = cleaned.match(/^([\d.]+)\s*(cr|crore|crores?)$/i);
  if (crMatch) return { amount: crMatch[1], unit: "crore" };

  const lakhMatch = cleaned.match(/^([\d.]+)\s*(l|lac|lakh|lakhs?)$/i);
  if (lakhMatch) return { amount: lakhMatch[1], unit: "lakh" };

  const kMatch = cleaned.match(/^([\d.]+)\s*(k|thousand|thousands?)$/i);
  if (kMatch) return { amount: kMatch[1], unit: "thousand" };

  const numMatch = cleaned.match(/^([\d.]+)/);
  if (numMatch) {
    if (/crore|cr/.test(cleaned)) return { amount: numMatch[1], unit: "crore" };
    if (/lakh|lac|\bl\b/.test(cleaned)) return { amount: numMatch[1], unit: "lakh" };
    if (/thousand|\bk\b/.test(cleaned)) return { amount: numMatch[1], unit: "thousand" };
    return { amount: numMatch[1], unit: "lakh" };
  }

  return { amount: "", unit: "lakh" };
}
