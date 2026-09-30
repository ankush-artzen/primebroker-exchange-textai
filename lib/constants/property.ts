export const PROPERTY_CONFIGURATIONS = [
  "None",
  "Vacant Plot",
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "5 BHK",
  "10% Constructed",
  "25% Constructed",
  "50% Constructed",
  "75% Constructed",
  "100% Constructed",
  "Single Storey",
  "Double Storey",
  "Triple Storey",
  "Duplex",
  "Triplex",
  "Floorwise",
] as const;

export type PropertyConfiguration = (typeof PROPERTY_CONFIGURATIONS)[number];

export function getConfigurationOptions(current?: string | null): string[] {
  const trimmed = current?.trim();
  if (trimmed && !PROPERTY_CONFIGURATIONS.includes(trimmed as PropertyConfiguration)) {
    return [trimmed, ...PROPERTY_CONFIGURATIONS];
  }
  return [...PROPERTY_CONFIGURATIONS];
}

export const PROPERTY_AVAILABILITY_OPTIONS = [
  { id: "available", label: "Available" },
  { id: "reserved", label: "Reserved" },
  { id: "sold", label: "Sold" },
] as const;

export type PropertyAvailability =
  (typeof PROPERTY_AVAILABILITY_OPTIONS)[number]["id"];

export const PROPERTY_AREA_UNITS = [
  { id: "sq-ft", label: "Square Feet" },
  { id: "sq-yd", label: "Square Yards" },
  { id: "sq-m", label: "Square Meters" },
  { id: "acre", label: "Acres" },
  { id: "kanal", label: "Kanal" },
  { id: "marla", label: "Marla" },
  { id: "gaj", label: "Gaj" },
] as const;

export type PropertyAreaUnit = (typeof PROPERTY_AREA_UNITS)[number]["id"];
