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

const BELOW_TWENTY = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function twoDigits(n: number) {
  if (n < 20) return BELOW_TWENTY[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one ? `${TENS[ten]} ${BELOW_TWENTY[one]}` : TENS[ten];
}

function threeDigits(n: number) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return [hundred ? `${BELOW_TWENTY[hundred]} hundred` : "", rest ? twoDigits(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

export function amountInWords(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const words = [
    crore ? `${twoDigits(crore)} crore` : "",
    lakh ? `${twoDigits(lakh)} lakh` : "",
    thousand ? `${twoDigits(thousand)} thousand` : "",
    rest ? threeDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupees`;
}
