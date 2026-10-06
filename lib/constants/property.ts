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

export const LISTING_INTENTS = [
  { id: "sell", label: "Sell" },
  { id: "rent", label: "Rent / Lease" },
] as const;

export const RESIDENTIAL_LISTING_TYPES = [
  { id: "sell", label: "For Sale" },
  { id: "rent", label: "For Rent" },
] as const;

export const PROPERTY_CATEGORIES = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = [
  { id: "flat", label: "Flat/Apartment" },
  { id: "house", label: "Independent House/Villa" },
  { id: "builder-floor", label: "Builder Floor" },
  { id: "plot", label: "Plot/Land" },
  { id: "studio", label: "1RK/Studio" },
  { id: "farmserviced-apartment", label: "Serviced Apartment" },
  { id: "farmhouse", label: "Farmhouse" },
 
  { id: "other", label: "Other" },
] as const;

export const COMMERCIAL_PROPERTY_TYPES = [
  { id: "office", label: "Office" },
  { id: "retail", label: "Retail" },
  { id: "plot-land", label: "Plot / Land" },
  { id: "storage", label: "Storage" },
  { id: "industry", label: "Industry" },
  { id: "hospitality", label: "Hospitality" },
  { id: "other", label: "Other" },
] as const;

export const OFFICE_TYPES = [
  { id: "ready-to-move", label: "Ready to move office space" },
  { id: "bare-shell", label: "Bare shell office space" },
  { id: "co-working", label: "Co-working office space" },
] as const;

export const PLOT_TYPES = [
  { id: "commercial-land", label: "Commercial Land/Inst. Land" },
  { id: "Agricultural-land", label: "Agricultural/Farm Land" },
  { id: "Industrial-Land", label: "Industrial Lands/Plots" },


] as const;

export const RETAIL_TYPES = [
  { id:  "Commercial Shops", label: "Commercial Shops" },
  { id: "Commercial Showrooms", label: "Commercial Showrooms" },

] as const;

export const SHOP_LOCATIONS = [
  { id: "mall", label: "Mall" },
  { id: "commercial-project", label: "Commercial Project" },
  { id: "residential-project", label: "Residential Project" },
  { id: "retail-complex", label: "Retail Complex/Building" },
  { id: "market", label: "Market / High Street" },
  { id: "others", label: "Others" },
] as const;

export const SHOP_WASHROOM_OPTIONS = [
  { id: "private", label: "Private washrooms" },
  { id: "public", label: "Public washrooms" },
  { id: "not-available", label: "Not Available" },
] as const;

export const PARKING_TYPE_OPTIONS = [
  { id: "private", label: "Private Parking" },
  { id: "public", label: "Public Parking" },
  { id: "multilevel", label: "Multilevel Parking" },
  { id: "not-available", label: "Not Available" },
] as const;

export const STORAGE_TYPES =  [
  { id: "warehouse", label: "Warehouse" },
  { id: "Cold-Storage", label: "Cold Storage" },

] as const;

export const INDUSTRY_TYPES = [
  { id: "Factory", label: "Factory" },
  { id: "Manufacturing", label: "Manufacturing" },

] as const;

export const HOSPITALITY_TYPES = [
  { id: "Hotel", label: "Hotel/Resorts" },
  { id: "Resort", label: "ReGuest-House/Banquet-Hallssort" },

] as const;

export const PRESENCE_OPTIONS = [
  { id: "available", label: "Available" },
  { id: "not-available", label: "Not Available" },
] as const;

export const PANTRY_TYPES = [
  { id: "private", label: "Private" },
  { id: "shared", label: "Shared" },
  { id: "not-available", label: "Not Available" },
] as const;

const LEGACY_COMMERCIAL_TYPE_LABELS: Record<string, string> = {
  shop: "Shop / Showroom",
  "commercial-land": "Commercial Land",
  warehouse: "Warehouse / Godown",
  "industrial-building": "Industrial Building",
  "industrial-shed": "Industrial Shed",
  agricultural: "Agricultural Land",
};

export const APARTMENT_BHK_OPTIONS = [
  { id: "3 BHK", label: "3 BHK" },
  { id: "4 BHK", label: "4 BHK" },
  { id: "5 BHK", label: "5 BHK" },
  { id: "6 BHK", label: "6 BHK" },
  { id: "other", label: "Other" },
] as const;

export const BEDROOM_OPTIONS = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4", label: "4" },
  { id: "5+", label: "5+" },
] as const;

export const BATHROOM_OPTIONS = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4+", label: "4+" },
] as const;

export const BALCONY_OPTIONS = [
  { id: "0", label: "0" },
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3+", label: "3+" },
] as const;

export const ADDITIONAL_ROOM_OPTIONS = [
  { id: "pooja", label: "Pooja room" },
  { id: "study", label: "Study room" },
  { id: "servant", label: "Servant room" },
  { id: "store", label: "Store room" },
] as const;

export const FURNISHING_OPTIONS = [
  { id: "furnished", label: "Furnished" },
  { id: "semi", label: "Semi-furnished" },
  { id: "unfurnished", label: "Un-furnished" },
] as const;

export const POSSESSION_OPTIONS = [
  { id: "ready", label: "Ready to move" },
  { id: "under-construction", label: "Under construction" },
] as const;

export const BUILDER_FLOOR_TYPES = [
  { id: "Single Floor", label: "Single Floor" },
  { id: "Duplex", label: "Duplex" },
  { id: "Triplex", label: "Triplex" },
] as const;

export const BUILDER_FLOOR_AGE_OPTIONS = [
  { id: "0-1", label: "0–1 years" },
  { id: "1-5", label: "1–5 years" },
  { id: "5-10", label: "5–10 years" },
  { id: "10-15", label: "10–15 years" },
  { id: "15+", label: "15+ years" },
] as const;

export const POSSESSION_BY_OPTIONS = [
  { id: "3-months", label: "Within 3 Months" },
  { id: "6-months", label: "Within 6 Months" },
  { id: "2027", label: "By 2027" },
  { id: "2028", label: "By 2028" },
  { id: "2029", label: "By 2029" },
  { id: "2030", label: "By 2030" },
] as const;

export const BUILDER_FLOOR_BALCONY_OPTIONS = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "3+", label: "More than 3" },
] as const;

export const PLOT_POSSESSION_OPTIONS = [
  { id: "immediate", label: "Immediate" },
  { id: "3-months", label: "Within 3 Months" },
  { id: "6-months", label: "Within 6 Months" },
  { id: "2027", label: "By 2027" },
  { id: "2028", label: "By 2028" },
  { id: "2029", label: "By 2029" },
] as const;

export const PLOT_CONSTRUCTION_OPTIONS = [
  { id: "shed", label: "Shed" },
  { id: "rooms", label: "Room(s)" },
  { id: "washroom", label: "Washroom" },
  { id: "other", label: "Other" },
] as const;

export const PROPERTY_AGE_OPTIONS = [
  { id: "new", label: "New construction" },
  { id: "0-1", label: "0–1 years" },
  { id: "1-5", label: "1–5 years" },
  { id: "5-10", label: "5–10 years" },
  { id: "10+", label: "10+ years" },
] as const;

export const RENT_AGE_OPTIONS = [
  { id: "0-1", label: "0–1 years" },
  { id: "1-5", label: "1–5 years" },
  { id: "5-10", label: "5–10 years" },
  { id: "10+", label: "10+ years" },
] as const;

export const RENT_TENANT_OPTIONS = [
  { id: "family", label: "Family" },
  { id: "single-men", label: "Single men" },
  { id: "single-women", label: "Single women" },
  { id: "company", label: "Company leasing" },
  { id: "anyone", label: "Anyone" },
] as const;

export const RENT_FURNISHING_OPTIONS = [
  { id: "furnished", label: "Furnished" },
  { id: "semi", label: "Semi-furnished" },
  { id: "unfurnished", label: "Un-furnished" },
] as const;

export const RENT_BALCONY_OPTIONS = [
  { id: "0", label: "0" },
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "3+", label: "More than 3" },
] as const;

export const FACING_OPTIONS = [
  { id: "north", label: "N" },
  { id: "south", label: "S" },
  { id: "east", label: "E" },
  { id: "west", label: "W" },
  { id: "north-east", label: "NE" },
  { id: "north-west", label: "NW" },
  { id: "south-east", label: "SE" },
  { id: "south-west", label: "SW" },
] as const;

export const POWER_BACKUP_OPTIONS = [
  { id: "none", label: "None" },
  { id: "partial", label: "Partial" },
  { id: "full", label: "Full" },
] as const;

export const FLOORING_OPTIONS = [
  { id: "marble", label: "Marble" },
  { id: "concrete", label: "Concrete" },
  { id: "polished-concrete", label: "Polished Concrete" },
  { id: "granite", label: "Granite" },
  { id: "ceramic", label: "Ceramic" },
  { id: "vitrified", label: "Vitrified" },
  { id: "mosaic", label: "Mosaic" },
  { id: "normal-tiles", label: "Normal Tiles" },
  { id: "wooden", label: "Wooden" },
  { id: "other", label: "Other" },
] as const;

export const AREA_TYPE_OPTIONS = [
  { id: "carpet", label: "Carpet area" },
  { id: "plot", label: "Plot area" },
  { id: "built-up", label: "Built-up area" },
  { id: "super-built-up", label: "Super built-up area" },
] as const;

export const FORM_AREA_TYPES = [
  { id: "carpet", label: "Carpet area" },
  { id: "plot", label: "Plot area" },
  { id: "built-up", label: "Built-up area" },
] as const;

export const FORM_AREA_UNITS = [
  { id: "sq-ft", label: "sq.ft" },
  { id: "gaj", label: "gaj" },
  { id: "marla", label: "marla" },
  { id: "kanal", label: "kanal" },
] as const;

export type FormAreaUnit = (typeof FORM_AREA_UNITS)[number]["id"];

export const WATER_SOURCE_OPTIONS = [
  { id: "municipal", label: "Municipal" },
  { id: "borewell", label: "Borewell" },
  { id: "both", label: "Both" },
  { id: "other", label: "Other" },
] as const;

export const OWNERSHIP_OPTIONS = [
  { id: "freehold", label: "Freehold" },
  { id: "leasehold", label: "Leasehold" },
  { id: "cooperative", label: "Co-operative Society" },
  { id: "poa", label: "Power of Attorney" },
] as const;

export const POSTED_AS_OPTIONS = [
  { id: "owner", label: "Owner" },
  { id: "broker", label: "Broker" },
  { id: "builder", label: "Builder" },
] as const;

export const TENANT_OPTIONS = [
  { id: "family", label: "Family" },
  { id: "bachelors", label: "Bachelors" },
  { id: "company", label: "Company" },
  { id: "any", label: "Any" },
] as const;

export const YES_NO_OPTIONS = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
] as const;

export const OPEN_SIDE_OPTIONS = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4", label: "4" },
] as const;

export const COMMERCIAL_LAND_OPEN_SIDES = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3+", label: "3+" },
] as const;

export const RESIDENTIAL_AMENITIES = [
  { id: "lift", label: "Lift" },
  { id: "security", label: "Security Guard" },
  { id: "club", label: "Club House" },
  { id: "gym", label: "Gymnasium" },
  { id: "play-area", label: "Children's Play Area" },
  { id: "cctv", label: "CCTV Surveillance" },
  { id: "visitor-parking", label: "Visitor Parking" },
  { id: "water-storage", label: "Water Storage" },
  { id: "intercom", label: "Intercom Facility" },
] as const;

export const COMMERCIAL_AMENITIES = [
  { id: "parking", label: "Reserved parking" },
  { id: "lift", label: "Lift" },
  { id: "power-backup", label: "Power backup" },
  { id: "security", label: "Security" },
  { id: "cafeteria", label: "Cafeteria" },
  { id: "conference", label: "Conference room" },
  { id: "reception", label: "Reception" },
  { id: "fire-safety", label: "Fire safety" },
  { id: "central-ac", label: "Central air conditioning" },
  { id: "visitor-parking", label: "Visitor parking" },
] as const;

const LAND_TYPES = new Set(["plot", "plot-land", "commercial-land", "agricultural"]);
const FLOOR_NUMBER_TYPES = new Set([
  "flat",
  "builder-floor",
  "studio",
  "serviced",
  "office",
  "shop",
  "retail",
  "hospitality",
]);

export function optionLabel(
  options: readonly { id: string; label: string }[],
  id?: string | null,
) {
  if (!id) return "";
  return options.find((option) => option.id === id)?.label ?? id;
}

export function propertyTypeLabel(
  category?: string | null,
  propertyType?: string | null,
) {
  if (!propertyType) return "";
  const preferred =
    category === "commercial"
      ? COMMERCIAL_PROPERTY_TYPES
      : RESIDENTIAL_PROPERTY_TYPES;
  return (
    preferred.find((option) => option.id === propertyType)?.label ??
    [...RESIDENTIAL_PROPERTY_TYPES, ...COMMERCIAL_PROPERTY_TYPES].find(
      (option) => option.id === propertyType,
    )?.label ??
    LEGACY_COMMERCIAL_TYPE_LABELS[propertyType] ??
    propertyType
  );
}

export function getPropertyTypeOptions(
  category?: string | null,
  current?: string | null,
) {
  const options =
    category === "commercial"
      ? [...COMMERCIAL_PROPERTY_TYPES]
      : category === "residential"
        ? [...RESIDENTIAL_PROPERTY_TYPES]
        : [];
  if (current && !options.some((option) => option.id === current)) {
    return [{ id: current, label: propertyTypeLabel(category, current) }, ...options];
  }
  return options;
}


export function amenityOptions(category?: string | null) {
  return category === "commercial" ? COMMERCIAL_AMENITIES : RESIDENTIAL_AMENITIES;
}

export function amenityLabel(id: string) {
  return optionLabel(
    [...RESIDENTIAL_AMENITIES, ...COMMERCIAL_AMENITIES],
    id,
  );
}

export function isLandType(propertyType?: string | null) {
  return !!propertyType && LAND_TYPES.has(propertyType);
}

export function showsRoomDetails(propertyType?: string | null) {
  return !!propertyType && !isLandType(propertyType);
}

export function showsBedrooms(propertyType?: string | null) {
  return showsRoomDetails(propertyType) && propertyType !== "studio";
}

export function showsPropertyFloor(propertyType?: string | null) {
  return !!propertyType && FLOOR_NUMBER_TYPES.has(propertyType);
}

export const NAMED_PROPERTY_FLOORS = [
  { id: "basement", label: "Basement" },
  { id: "lower-ground", label: "Lower Ground" },
  { id: "ground", label: "Ground" },
] as const;

const DEFAULT_FLOOR_COUNT = 40;
const MAX_FLOOR_COUNT = 100;

export function propertyFloorOptions(totalFloors?: string | null, current?: string | null) {
  const parsed = Number.parseInt((totalFloors ?? "").trim(), 10);
  let count = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FLOOR_COUNT;
  count = Math.min(Math.max(count, 1), MAX_FLOOR_COUNT);
  const currentNumber = Number.parseInt((current ?? "").trim(), 10);
  if (Number.isFinite(currentNumber) && currentNumber > count && currentNumber <= MAX_FLOOR_COUNT) {
    count = currentNumber;
  }

  const options: { id: string; label: string }[] = [
    ...NAMED_PROPERTY_FLOORS,
    ...Array.from({ length: count }, (_, index) => {
      const floor = String(index + 1);
      return { id: floor, label: floor };
    }),
  ];
  const trimmed = current?.trim() ?? "";
  if (trimmed && !options.some((option) => option.id === trimmed)) {
    options.unshift({ id: trimmed, label: propertyFloorLabel(trimmed) });
  }
  return options;
}

export function propertyFloorLabel(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const named = NAMED_PROPERTY_FLOORS.find((option) => option.id === trimmed);
  return named?.label ?? trimmed;
}

export function isNamedPropertyFloor(value?: string | null) {
  return NAMED_PROPERTY_FLOORS.some((option) => option.id === value?.trim());
}
