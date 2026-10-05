import {
  ADDITIONAL_ROOM_OPTIONS,
  AREA_TYPE_OPTIONS,
  FACING_OPTIONS,
  FLOORING_OPTIONS,
  FURNISHING_OPTIONS,
  OWNERSHIP_OPTIONS,
  POWER_BACKUP_OPTIONS,
  POSSESSION_OPTIONS,
  POSTED_AS_OPTIONS,
  PROPERTY_AGE_OPTIONS,
  RENT_TENANT_OPTIONS,
  TENANT_OPTIONS,
  WATER_SOURCE_OPTIONS,
  YES_NO_OPTIONS,
  amenityLabel,
  optionLabel,
  propertyTypeLabel,
} from "@/lib/constants/property";
import type { Property } from "@/lib/types";

const LISTING_STRING_KEYS = [
  "intent",
  "category",
  "propertyType",
  "city",
  "locality",
  "subLocality",
  "society",
  "houseNumber",
  "bedrooms",
  "bathrooms",
  "balconies",
  "furnishing",
  "totalFloors",
  "propertyFloor",
  "possession",
  "propertyAge",
  "possessionBy",
  "areaType",
  "carpetArea",
  "plotArea",
  "builtUpArea",
  "facing",
  "powerBackup",
  "flooring",
  "coveredParking",
  "openParking",
  "waterSource",
  "ownership",
  "postedAs",
  "maintenance",
  "deposit",
  "preferredTenant",
  "availableFrom",
  "brokerContact",
  "plotLength",
  "plotBreadth",
  "boundaryWall",
  "openSides",
  "floorsAllowed",
  "constructionDone",
] as const;

const LISTING_ARRAY_KEYS = ["amenities", "additionalRooms", "preferredTenants"] as const;

export function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function photoUrlsFrom(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((url): url is string => typeof url === "string");
}

export function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function listingFromBody(body: Record<string, unknown>) {
  const listing: Record<string, unknown> = {};

  for (const key of LISTING_STRING_KEYS) {
    if (!(key in body)) continue;
    listing[key] = optionalText(body[key]);
  }

  if ("negotiable" in body) {
    listing.negotiable = Boolean(body.negotiable);
  }
  if ("chargesExcluded" in body) {
    listing.chargesExcluded = Boolean(body.chargesExcluded);
  }

  for (const key of LISTING_ARRAY_KEYS) {
    if (!(key in body)) continue;
    const value = body[key];
    listing[key] = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && !!item.trim())
      : [];
  }

  return listing;
}

export function configurationFromListing(input: {
  configuration?: string | null;
  bedrooms?: string | null;
  propertyType?: string | null;
}) {
  const current = input.configuration?.trim();
  if (current) return current;
  const bedrooms = input.bedrooms?.trim();
  if (bedrooms) return bedrooms === "5+" ? "5 BHK" : `${bedrooms} BHK`;
  if (
    input.propertyType === "plot" ||
    input.propertyType === "commercial-land" ||
    input.propertyType === "agricultural"
  ) {
    return "Vacant Plot";
  }
  return "";
}

export function suggestTitle(input: {
  intent?: string | null;
  category?: string | null;
  propertyType?: string | null;
  bedrooms?: string | null;
  society?: string | null;
  locality?: string | null;
  city?: string | null;
}) {
  const type = propertyTypeLabel(input.category, input.propertyType);
  if (!type && !input.bedrooms?.trim()) return "";
  const bedrooms = input.bedrooms?.trim();
  const bhk = bedrooms
    ? `${bedrooms === "5+" ? "5" : bedrooms} BHK `
    : "";
  const intent =
    input.intent === "rent" ? "for Rent" : input.intent === "sell" ? "for Sale" : "";
  const place = [input.society, input.locality, input.city].find((part) => part?.trim());
  return `${bhk}${type}${intent ? ` ${intent}` : ""}${place ? ` in ${place.trim()}` : ""}`
    .replace(/\s+/g, " ")
    .trim();
}

export function formatAreaDetail(area?: string | null, areaType?: string | null) {
  if (!area?.trim()) return null;
  const kind = optionLabel(AREA_TYPE_OPTIONS, areaType);
  return kind ? `${kind} · ${area.trim()}` : area.trim();
}

function formatMonth(value?: string | null) {
  if (!value?.trim()) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatFloor(property: Pick<Property, "propertyFloor" | "totalFloors">) {
  if (property.propertyFloor && property.totalFloors) {
    return `Floor ${property.propertyFloor} of ${property.totalFloors}`;
  }
  if (property.totalFloors) return `${property.totalFloors} floors`;
  if (property.propertyFloor) return `Floor ${property.propertyFloor}`;
  return "";
}

export function listingDetailRows(property: Property) {
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value?: string | null | boolean) => {
    if (value === true) {
      rows.push({ label, value: "Yes" });
      return;
    }
    if (typeof value === "string" && value.trim()) {
      rows.push({ label, value: value.trim() });
    }
  };

  push(
    "Looking to",
    optionLabel(
      property.category === "residential"
        ? [
            { id: "sell", label: "For Sale" },
            { id: "rent", label: "For Rent" },
          ]
        : [
            { id: "sell", label: "Sell" },
            { id: "rent", label: "Rent / Lease" },
          ],
      property.intent,
    ),
  );
  push("Property type", propertyTypeLabel(property.category, property.propertyType));
  push("City", property.city);
  push("Locality", property.locality);
  push("Sub locality", property.subLocality);
  push("Apartment / Society", property.society);
  push("House no.", property.houseNumber);
  push("Carpet area", property.carpetArea);
  push("Plot area", property.plotArea);
  push("Built-up area", property.builtUpArea);
  push("Bedrooms", property.bedrooms);
  push(
    property.category === "commercial" ? "Washrooms" : "Bathrooms",
    property.bathrooms,
  );
  push("Balconies", property.balconies);
  if (property.additionalRooms?.length) {
    push(
      "Other rooms",
      property.additionalRooms
        .map((id) => optionLabel(ADDITIONAL_ROOM_OPTIONS, id))
        .join(", "),
    );
  }
  push("Furnishing", optionLabel(FURNISHING_OPTIONS, property.furnishing));
  push("Floor", formatFloor(property));
  push("Possession", optionLabel(POSSESSION_OPTIONS, property.possession));
  push("Age of property", optionLabel(PROPERTY_AGE_OPTIONS, property.propertyAge));
  push("Possession by", formatMonth(property.possessionBy));
  push("Facing", optionLabel(FACING_OPTIONS, property.facing));
  push("Power backup", optionLabel(POWER_BACKUP_OPTIONS, property.powerBackup));
  push("Flooring", optionLabel(FLOORING_OPTIONS, property.flooring));
  const parking = [
    property.coveredParking ? `${property.coveredParking} covered` : "",
    property.openParking ? `${property.openParking} open` : "",
  ]
    .filter(Boolean)
    .join(", ");
  push("Parking", parking);
  push("Water source", optionLabel(WATER_SOURCE_OPTIONS, property.waterSource));
  if (property.plotLength || property.plotBreadth) {
    push(
      "Dimensions",
      [property.plotLength, property.plotBreadth].filter(Boolean).join(" × "),
    );
  }
  push("Floors allowed", property.floorsAllowed);
  push("Boundary wall", optionLabel(YES_NO_OPTIONS, property.boundaryWall));
  push("Open sides", property.openSides);
  push("Construction done", optionLabel(YES_NO_OPTIONS, property.constructionDone));
  push("Ownership", optionLabel(OWNERSHIP_OPTIONS, property.ownership));
  push("Posted as", optionLabel(POSTED_AS_OPTIONS, property.postedAs));
  push("Maintenance", property.maintenance);
  push("Security deposit", property.deposit);
  push("Available from", property.availableFrom);
  if (property.preferredTenants?.length) {
    push(
      "Willing to rent out to",
      property.preferredTenants
        .map((id) => optionLabel(RENT_TENANT_OPTIONS, id))
        .join(", "),
    );
  } else {
    push("Preferred tenant", optionLabel(TENANT_OPTIONS, property.preferredTenant));
  }
  if (property.chargesExcluded) push("Electricity & water", "Excluded");
  push("Brokers can contact", optionLabel(YES_NO_OPTIONS, property.brokerContact));
  if (property.negotiable) push("Negotiable", true);
  if (property.amenities?.length) {
    push("Amenities", property.amenities.map((id) => amenityLabel(id)).join(", "));
  }

  return rows;
}
