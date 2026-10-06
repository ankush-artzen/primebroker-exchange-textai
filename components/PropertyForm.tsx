"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { PropertyFormData } from "@/lib/types";
import { PriceField } from "@/components/PriceField";
import {
  BUILDER_FLOOR_TYPES,
  OWNERSHIP_OPTIONS,
  POSTED_AS_OPTIONS,
  PROPERTY_AVAILABILITY_OPTIONS,
  PROPERTY_CATEGORIES,
  TENANT_OPTIONS,
  amenityOptions,
  isLandType,
  showsPropertyFloor,
} from "@/lib/constants/property";
import { configurationFromListing, suggestTitle } from "@/lib/property-listing";
import { formatMissingFieldsSummary, scrollToFirstFieldError } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ButtonLoader, Spinner } from "@/components/Loader";
import { PlaceSearch, type PlaceHit } from "@/components/PlaceSearch";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { CommercialDetails } from "@/components/property-form/commercial/CommercialDetails";
import { CommercialLandProfile } from "@/components/property-form/commercial/CommercialLandProfile";
import { CommercialProfile } from "@/components/property-form/commercial/CommercialProfile";
import { RetailShopMallProfile } from "@/components/property-form/commercial/RetailShopMallProfile";
import { BareShellOfficeProfile } from "@/components/property-form/commercial/BareShellOfficeProfile";
import { CoWorkingOfficeProfile } from "@/components/property-form/commercial/CoWorkingOfficeProfile";
import { OfficeProfile } from "@/components/property-form/commercial/OfficeProfile";
import {
  CheckField,
  Choices,
  Field,
  MultiChoices,
  SelectField,
  fieldClass,
} from "@/components/property-form/fields";
import {
  areaSummary,
  legacyAreas,
  rentAmountError,
  salePriceError,
} from "@/components/property-form/helpers";
import { FormMessage } from "@/components/property-form/messages";
import { ResidentialBuilderFloorProfile } from "@/components/property-form/residential/ResidentialBuilderFloorProfile";
import { ResidentialDetails } from "@/components/property-form/residential/ResidentialDetails";
import { ResidentialPlotProfile } from "@/components/property-form/residential/ResidentialPlotProfile";
import { ResidentialProfile } from "@/components/property-form/residential/ResidentialProfile";
import { RentProfile } from "@/components/property-form/residential/RentProfile";
import type { ListingDraft } from "@/components/property-form/types";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-xl border border-border bg-background">
        <Spinner size={24} />
      </div>
    ),
  },
);

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Location" },
  { id: 3, label: "Property" },
  { id: 4, label: "Photos" },
  { id: 5, label: "Price" },
] as const;

const STEP_TITLES = [
  "What are you listing?",
  "Where is your property located?",
  "Property details",
  "Add photos",
  "Price and ownership",
];

const STEP_HINTS = [
  "Choose the listing and property type.",
  "An accurate location helps you connect with the right buyers.",
  "Rooms, area, furnishing, and amenities.",
  "JPEG, PNG, or WebP. Up to 5 MB each.",
  "Set the price, availability, and notes.",
];

type StepField =
  | "intent"
  | "category"
  | "propertyType"
  | "officeType"
  | "retailType"
  | "shopLocation"
  | "plotType"
  | "storageType"
  | "city"
  | "locality"
  | "location"
  | "title"
  | "price"
  | "currentRent"
  | "area";

const emptyDraft = (): ListingDraft => ({
  title: "",
  location: "",
  price: "",
  configuration: "",
  area: "",
  availability: "available",
  notes: "",
  photoUrls: [],
  intent: "",
  category: "",
  propertyType: "",
  officeType: "",
  retailType: "",
  shopLocation: "",
  shopWashroom: "",
  parkingType: "",
  entranceWidth: "",
  ceilingHeight: "",
  bookingAmount: "",
  industryType: "",
  hospitalityType: "",
  plotType: "",
  storageType: "",
  minWorkstations: "",
  maxWorkstations: "",
  cabins: "",
  meetingRooms: "",
  washroomAvailability: "",
  conferenceRoom: "",
  receptionArea: "",
  pantryType: "",
  facilityParking: "",
  centralAc: "",
  lifts: "",
  parkingAvailability: "",
  preLeased: "",
  currentRent: "",
  leaseTenure: "",
  annualRentIncrement: "",
  leasedTo: "",
  dgUpsIncluded: false,
  city: "",
  locality: "",
  subLocality: "",
  society: "",
  houseNumber: "",
  bedrooms: "",
  bathrooms: "",
  balconies: "",
  additionalRooms: [],
  furnishing: "",
  totalFloors: "",
  propertyFloor: "",
  possession: "",
  propertyAge: "",
  possessionBy: "",
  areaType: "",
  carpetArea: "",
  plotArea: "",
  builtUpArea: "",
  superBuiltUpArea: "",
  facing: "",
  powerBackup: "",
  flooring: "",
  coveredParking: "",
  openParking: "",
  waterSource: "",
  ownership: "",
  postedAs: "broker",
  negotiable: false,
  allInclusive: false,
  priceDetails: "",
  maintenance: "",
  deposit: "",
  preferredTenant: "",
  preferredTenants: [],
  availableFrom: "",
  brokerContact: "",
  chargesExcluded: false,
  plotLength: "",
  plotBreadth: "",
  boundaryWall: "",
  openSides: "",
  floorsAllowed: "",
  constructionDone: "",
  constructionTypes: [],
  approvedBy: "",
  amenities: [],
});

function text(value?: string | null) {
  return value ?? "";
}

function tenantList(initial?: Partial<PropertyFormData>) {
  if (initial?.preferredTenants?.length) return [...initial.preferredTenants];
  const single = text(initial?.preferredTenant);
  if (!single) return [];
  if (single === "any") return ["anyone"];
  if (single === "bachelors") return ["single-men"];
  return single.split(",").map((item) => item.trim()).filter(Boolean);
}

function capCount(value: string, plusAt: number) {
  if (!value) return "";
  const count = Number.parseInt(value, 10);
  if (!Number.isFinite(count)) return value;
  if (count >= plusAt) return `${plusAt}+`;
  return String(count);
}

function samePlace(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isResidentialBuilderFloor(input: { category: string; propertyType: string }) {
  return input.category === "residential" && input.propertyType === "builder-floor";
}

function isResidentialPlot(input: { category: string; propertyType: string }) {
  return input.category === "residential" && input.propertyType === "plot";
}

function isRetailShopMall(input: {
  intent: string;
  category: string;
  propertyType: string;
  retailType: string;
  shopLocation: string;
}) {
  if (
    input.category !== "commercial" ||
    input.propertyType !== "retail" ||
    input.retailType !== "Commercial Shops"
  ) {
    return false;
  }
  if (input.shopLocation === "mall") return true;
  return input.intent === "sell" && input.shopLocation === "commercial-project";
}

function clearRetailShop(next: ListingDraft) {
  next.shopWashroom = "";
  next.parkingType = "";
  next.entranceWidth = "";
  next.ceilingHeight = "";
  next.bookingAmount = "";
}

function isOfficeListing(input: { category: string; propertyType: string }) {
  return input.category === "commercial" && input.propertyType === "office";
}

function isCommercialLand(input: {
  intent: string;
  category: string;
  propertyType: string;
  plotType: string;
}) {
  return (
    input.intent === "sell" &&
    input.category === "commercial" &&
    input.propertyType === "plot-land" &&
    input.plotType === "commercial-land"
  );
}

function isGenericCommercial(input: {
  intent: string;
  category: string;
  propertyType: string;
  retailType: string;
  shopLocation: string;
  plotType: string;
}) {
  return (
    input.category === "commercial" &&
    !isOfficeListing(input) &&
    !isRetailShopMall(input) &&
    !isCommercialLand(input)
  );
}

function clearCommercialLandLease(next: ListingDraft) {
  next.preLeased = "";
  next.currentRent = "";
  next.leaseTenure = "";
  next.annualRentIncrement = "";
  next.leasedTo = "";
}

function clearOfficeSpace(next: ListingDraft) {
  next.minWorkstations = "";
  next.maxWorkstations = "";
  next.cabins = "";
  next.meetingRooms = "";
  next.washroomAvailability = "";
  next.conferenceRoom = "";
  next.receptionArea = "";
  next.pantryType = "";
  next.facilityParking = "";
  next.centralAc = "";
  next.lifts = "";
  next.parkingAvailability = "";
  next.preLeased = "";
  next.currentRent = "";
  next.leaseTenure = "";
  next.annualRentIncrement = "";
  next.leasedTo = "";
}

function isResidentialSaleProfile(input: {
  category: string;
  intent: string;
  propertyType: string;
}) {
  return (
    input.category === "residential" &&
    input.intent !== "rent" &&
    !isResidentialBuilderFloor(input) &&
    !isResidentialPlot(input)
  );
}

function locatedSummary(input: {
  society: string;
  houseNumber: string;
  subLocality: string;
  locality: string;
  city: string;
}) {
  const parts = [input.society, input.houseNumber, input.subLocality, input.locality, input.city]
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.filter((part, index) => !parts.slice(0, index).some((prev) => samePlace(prev, part))).join(", ");
}

const NEW_PROPERTY_DRAFT = "new-property-draft";

function readPropertyDraft(): {
  form: ListingDraft;
  step: number;
  pin: { lat: number; lon: number } | null;
} | null {
  try {
    const raw = sessionStorage.getItem(NEW_PROPERTY_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      form?: Partial<ListingDraft>;
      step?: number;
      pin?: { lat?: number; lon?: number } | null;
    };
    if (!parsed.form) return null;
    const step = parsed.step;
    const pin = parsed.pin;
    return {
      form: { ...emptyDraft(), ...parsed.form },
      step: typeof step === "number" && step >= 1 && step <= 5 ? step : 1,
      pin:
        pin && typeof pin.lat === "number" && typeof pin.lon === "number"
          ? { lat: pin.lat, lon: pin.lon }
          : null,
    };
  } catch {
    return null;
  }
}

function fromInitial(initial?: Partial<PropertyFormData>): ListingDraft {
  return {
    ...emptyDraft(),
    title: text(initial?.title),
    location: text(initial?.location),
    price: text(initial?.price),
    configuration: text(initial?.configuration),
    area: text(initial?.area),
    availability: initial?.availability || "available",
    notes: text(initial?.notes),
    photoUrls: initial?.photoUrls ?? [],
    intent: text(initial?.intent),
    category: text(initial?.category),
    propertyType: text(initial?.propertyType),
    officeType: text(initial?.officeType),
    retailType: text(initial?.retailType),
    shopLocation: text(initial?.shopLocation),
    shopWashroom: text(initial?.shopWashroom),
    parkingType: text(initial?.parkingType),
    entranceWidth: text(initial?.entranceWidth),
    ceilingHeight: text(initial?.ceilingHeight),
    bookingAmount: text(initial?.bookingAmount),
    industryType: text(initial?.industryType),
    hospitalityType: text(initial?.hospitalityType),
    plotType: text(initial?.plotType),
    storageType: text(initial?.storageType),
    minWorkstations: text(initial?.minWorkstations),
    maxWorkstations: text(initial?.maxWorkstations),
    cabins: text(initial?.cabins),
    meetingRooms: text(initial?.meetingRooms),
    washroomAvailability: text(initial?.washroomAvailability),
    conferenceRoom: text(initial?.conferenceRoom),
    receptionArea: text(initial?.receptionArea),
    pantryType: text(initial?.pantryType),
    facilityParking: text(initial?.facilityParking),
    centralAc: text(initial?.centralAc),
    lifts: text(initial?.lifts),
    parkingAvailability: text(initial?.parkingAvailability),
    preLeased: text(initial?.preLeased),
    currentRent: text(initial?.currentRent),
    leaseTenure: text(initial?.leaseTenure),
    annualRentIncrement: text(initial?.annualRentIncrement),
    leasedTo: text(initial?.leasedTo),
    dgUpsIncluded: Boolean(initial?.dgUpsIncluded),
    city: text(initial?.city),
    locality: text(initial?.locality),
    subLocality: text(initial?.subLocality),
    society: text(initial?.society),
    houseNumber: text(initial?.houseNumber),
    bedrooms: text(initial?.bedrooms),
    bathrooms: text(initial?.bathrooms),
    balconies: capCount(text(initial?.balconies), 3),
    additionalRooms: initial?.additionalRooms ?? [],
    furnishing: text(initial?.furnishing),
    totalFloors: text(initial?.totalFloors),
    propertyFloor: text(initial?.propertyFloor),
    possession: text(initial?.possession),
    propertyAge: text(initial?.propertyAge),
    possessionBy: text(initial?.possessionBy),
    areaType: text(initial?.areaType),
    ...legacyAreas(initial),
    superBuiltUpArea: text(initial?.superBuiltUpArea),
    facing: text(initial?.facing),
    powerBackup: text(initial?.powerBackup),
    flooring: text(initial?.flooring),
    coveredParking: text(initial?.coveredParking),
    openParking: text(initial?.openParking),
    waterSource: text(initial?.waterSource),
    ownership: text(initial?.ownership),
    postedAs: initial?.postedAs || "broker",
    negotiable: Boolean(initial?.negotiable),
    allInclusive: Boolean(initial?.allInclusive),
    priceDetails: text(initial?.priceDetails),
    maintenance: text(initial?.maintenance),
    deposit: text(initial?.deposit),
    preferredTenant: text(initial?.preferredTenant),
    preferredTenants: tenantList(initial),
    availableFrom: text(initial?.availableFrom),
    brokerContact: text(initial?.brokerContact),
    chargesExcluded: Boolean(initial?.chargesExcluded),
    plotLength: text(initial?.plotLength),
    plotBreadth: text(initial?.plotBreadth),
    boundaryWall: text(initial?.boundaryWall),
    openSides: text(initial?.openSides),
    floorsAllowed: text(initial?.floorsAllowed),
    constructionDone: text(initial?.constructionDone),
    constructionTypes: initial?.constructionTypes ?? [],
    approvedBy: text(initial?.approvedBy),
    amenities: initial?.amenities ?? [],
  };
}

interface Props {
  initial?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  wizardBackRef?: { current: (() => boolean) | null };
}

export function PropertyForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Property",
  wizardBackRef,
}: Props) {
  const keepDraft = !initial;
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null);
  const [form, setForm] = useState<ListingDraft>(() => fromInitial(initial));
  const [draftReady, setDraftReady] = useState(!keepDraft);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<StepField, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const skipScroll = useRef(true);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!keepDraft) return;
    const draft = readPropertyDraft();
    if (draft) {
      setForm(draft.form);
      setStep(draft.step);
      setPin(draft.pin);
    }
    setDraftReady(true);
  }, [keepDraft]);

  useEffect(() => {
    if (!keepDraft || !draftReady || savedRef.current) return;
    sessionStorage.setItem(NEW_PROPERTY_DRAFT, JSON.stringify({ form, step, pin }));
  }, [form, step, pin, keepDraft, draftReady]);

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const clearError = (field: StepField) => {
    setFieldErrors((errors) => {
      if (!errors[field]) return errors;
      const next = { ...errors };
      delete next[field];
      return next;
    });
    if (error) setError("");
  };

  const update = <K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (
      field === "intent" ||
      field === "category" ||
      field === "propertyType" ||
      field === "officeType" ||
      field === "retailType" ||
      field === "shopLocation" ||
      field === "plotType" ||
      field === "storageType" ||
      field === "city" ||
      field === "locality" ||
      field === "location" ||
      field === "title" ||
      field === "price" ||
      field === "currentRent"
    ) {
      clearError(field);
    } else if (
      field === "carpetArea" ||
      field === "plotArea" ||
      field === "builtUpArea" ||
      field === "superBuiltUpArea"
    ) {
      clearError("area");
    } else if (error) {
      setError("");
    }
  };

  const setIntent = (intent: string) => {
    setForm((current) => ({
      ...current,
      intent,
      ...(intent === "sell"
        ? {
            deposit: "",
            preferredTenant: "",
            preferredTenants: [],
            availableFrom: "",
            brokerContact: "",
            chargesExcluded: false,
            ...(current.propertyType === "studio" ? {} : { furnishing: "" }),
          }
        : {}),
    }));
    clearError("intent");
  };

  const setCategory = (category: string) => {
    setForm((current) => ({
      ...current,
      category,
      propertyType: "",
      officeType: "",
      retailType: "",
      shopLocation: "",
      shopWashroom: "",
      parkingType: "",
      entranceWidth: "",
      ceilingHeight: "",
      bookingAmount: "",
      industryType: "",
      hospitalityType: "",
      plotType: "",
      storageType: "",
      minWorkstations: "",
      maxWorkstations: "",
      cabins: "",
      meetingRooms: "",
      washroomAvailability: "",
      conferenceRoom: "",
      receptionArea: "",
      pantryType: "",
      facilityParking: "",
      centralAc: "",
      lifts: "",
      parkingAvailability: "",
      preLeased: "",
      currentRent: "",
      leaseTenure: "",
      annualRentIncrement: "",
      leasedTo: "",
      dgUpsIncluded: false,
      amenities: current.amenities.filter((id) =>
        amenityOptions(category).some((option) => option.id === id),
      ),
    }));
    clearError("category");
    clearError("propertyType");
    clearError("officeType");
    clearError("retailType");
    clearError("shopLocation");
    clearError("plotType");
    clearError("storageType");
  };

  const setPropertyType = (propertyType: string) => {
    setForm((current) => {
      const next = { ...current, propertyType };
      if (propertyType !== "office") {
        next.officeType = "";
        clearOfficeSpace(next);
      }
      if (propertyType !== "retail") {
        next.retailType = "";
        next.shopLocation = "";
        clearRetailShop(next);
      }
      if (propertyType !== "industry") next.industryType = "";
      if (propertyType !== "hospitality") next.hospitalityType = "";
      if (propertyType !== "plot-land") {
        if (current.plotType === "commercial-land") clearCommercialLandLease(next);
        next.plotType = "";
      }
      if (propertyType !== "storage") next.storageType = "";
      const floorTypes = new Set<string>(BUILDER_FLOOR_TYPES.map((option) => option.id));
      if (propertyType === "builder-floor") {
        if (!floorTypes.has(next.configuration)) next.configuration = "";
      } else if (floorTypes.has(next.configuration)) {
        next.configuration = "";
      }
      if (current.category === "residential") {
        if (current.intent !== "rent" && propertyType !== "studio") next.furnishing = "";
        return next;
      }
      if (isLandType(propertyType)) {
        const config = next.configuration.trim();
        if (!config || config.endsWith("BHK")) next.configuration = "Vacant Plot";
        next.bedrooms = "";
        next.bathrooms = "";
        next.balconies = "";
        next.additionalRooms = [];
        next.furnishing = "";
        next.propertyFloor = "";
        next.coveredParking = "";
        next.openParking = "";
        next.waterSource = "";
        next.facing = "";
      } else {
        next.plotLength = "";
        next.plotBreadth = "";
        next.boundaryWall = "";
        next.openSides = "";
        next.floorsAllowed = "";
        next.constructionDone = "";
      }
      if (propertyType === "studio") next.bedrooms = "";
      if (!showsPropertyFloor(propertyType)) next.propertyFloor = "";
      return next;
    });
    clearError("propertyType");
    clearError("officeType");
    clearError("retailType");
    clearError("shopLocation");
    clearError("plotType");
    clearError("storageType");
  };

  const setBuilderPossession = (possession: string) => {
    setForm((current) => ({
      ...current,
      possession,
      propertyAge: possession === "under-construction" ? "" : current.propertyAge,
      possessionBy: possession === "under-construction" ? current.possessionBy : "",
      allInclusive: possession === "under-construction" ? false : current.allInclusive,
      negotiable: possession === "under-construction" ? false : current.negotiable,
      priceDetails: possession === "under-construction" ? "" : current.priceDetails,
      chargesExcluded: possession === current.possession ? current.chargesExcluded : false,
    }));
  };

  const setConstructionDone = (constructionDone: string) => {
    setForm((current) => ({
      ...current,
      constructionDone,
      constructionTypes: constructionDone === "yes" ? current.constructionTypes : [],
      allInclusive: constructionDone === "no" ? false : current.allInclusive,
      negotiable: constructionDone === "no" ? false : current.negotiable,
      priceDetails: constructionDone === "no" ? "" : current.priceDetails,
      chargesExcluded: constructionDone === "no" ? false : current.chargesExcluded,
    }));
  };

  const toggleList = (field: "amenities" | "additionalRooms", id: string) => {
    setForm((current) => {
      const list = current[field];
      return {
        ...current,
        [field]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  };

  const validateStep = (current: ListingDraft, target: number) => {
    const errors: Partial<Record<StepField, string>> = {};
    if (target === 1) {
      if (!current.intent) errors.intent = "Choose sell or rent";
      if (!current.category) errors.category = "Choose residential or commercial";
      if (!current.propertyType) errors.propertyType = "Property type is required";
      if (current.category === "commercial" && current.propertyType === "office" && !current.officeType) {
        errors.officeType = "Choose the kind of office";
      }
      if (current.category === "commercial" && current.propertyType === "retail" && !current.retailType) {
        errors.retailType = "Choose the type of retail space";
      }
      if (
        current.category === "commercial" &&
        current.propertyType === "retail" &&
        current.retailType &&
        !current.shopLocation
      ) {
        errors.shopLocation = "Choose where the shop is located";
      }
      if (current.category === "commercial" && current.propertyType === "plot-land" && !current.plotType) {
        errors.plotType = "Choose the type of plot / land";
      }
      if (current.category === "commercial" && current.propertyType === "storage" && !current.storageType) {
        errors.storageType = "Choose the kind of storage";
      }
    }
    if (target === 2) {
      if (!current.city.trim()) errors.city = "City is required";
      if (!current.locality.trim()) errors.locality = "Locality is required";
    }
    if (
      target === 3 &&
      current.category === "residential" &&
      current.intent === "rent" &&
      current.propertyType !== "builder-floor" &&
      current.propertyType !== "plot"
    ) {
      if (!current.carpetArea.trim() && !current.plotArea.trim() && !current.builtUpArea.trim()) {
        errors.area = "At least one area type is mandatory.";
      }
      const rentError = rentAmountError(current.price, "Expected rent is required");
      if (rentError) errors.price = rentError;
    }
    if (target === 3 && (isResidentialBuilderFloor(current) || isResidentialPlot(current))) {
      const priceError = salePriceError(current.price, "Expected price is required");
      if (priceError) errors.price = priceError;
    }
    if (target === 3 && isResidentialSaleProfile(current)) {
      const priceError = salePriceError(current.price, "Please specify the price");
      if (priceError) errors.price = priceError;
    }
    if (target === 3 && isRetailShopMall(current)) {
      if (!current.carpetArea.trim()) errors.area = "Carpet area is mandatory.";
      const priceError = salePriceError(current.price, "Expected price is required");
      if (priceError) errors.price = priceError;
      if (current.preLeased === "yes") {
        const rentError = rentAmountError(current.currentRent, "Current rent per month is required");
        if (rentError) errors.currentRent = rentError;
      }
    }
    if (target === 3 && isCommercialLand(current)) {
      const priceError = salePriceError(current.price, "Expected price is required");
      if (priceError) errors.price = priceError;
      if (current.preLeased === "yes") {
        const rentError = rentAmountError(current.currentRent, "Current rent per month is required");
        if (rentError) errors.currentRent = rentError;
      }
    }
    if (target === 3 && isGenericCommercial(current)) {
      if (!current.carpetArea.trim() && !current.plotArea.trim() && !current.builtUpArea.trim()) {
        errors.area = "At least one area type is mandatory.";
      }
      const priceError = salePriceError(current.price, "Expected price is required");
      if (priceError) errors.price = priceError;
      if (current.preLeased === "yes") {
        const rentError = rentAmountError(current.currentRent, "Current rent per month is required");
        if (rentError) errors.currentRent = rentError;
      }
    }
    if (target === 3 && isOfficeListing(current)) {
      if (current.officeType === "co-working") {
        if (!current.carpetArea.trim() && !current.plotArea.trim() && !current.builtUpArea.trim()) {
          errors.area = "At least one area type is mandatory.";
        }
      }
      const priceError = salePriceError(current.price, "Expected price is required");
      if (priceError) errors.price = priceError;
      if (current.preLeased === "yes") {
        const rentError = rentAmountError(current.currentRent, "Current rent per month is required");
        if (rentError) errors.currentRent = rentError;
      }
    }
    if (target === 5) {
      const title = current.title.trim() || suggestTitle(current);
      if (!title) errors.title = "Property name is required";
      const priceError =
        current.intent === "rent" && current.category === "residential"
          ? rentAmountError(current.price, "Price is required")
          : salePriceError(current.price, "Price is required");
      if (priceError) errors.price = priceError;
    }
    return errors;
  };

  const showErrors = (errors: Partial<Record<StepField, string>>) => {
    const labels: Record<StepField, string> = {
      intent: "Sell or rent",
      category: "Residential or commercial",
      propertyType: "Property type",
      officeType: "Office type",
      retailType: "Retail type",
      shopLocation: "Shop location",
      plotType: "Plot / land type",
      storageType: "Storage type",
      city: "City",
      locality: "Locality",
      location: "Location",
      title: "Property Name",
      currentRent: "Current rent per month",
      price:
        form.category === "residential" &&
        form.intent === "rent" &&
        form.propertyType !== "builder-floor" &&
        form.propertyType !== "plot"
          ? "Expected rent"
          : "Expected price",
      area: "Area",
    };
    setFieldErrors(errors);
    setError(
      formatMissingFieldsSummary(
        Object.keys(errors).map((key) => labels[key as StepField]),
      ),
    );
    scrollToFirstFieldError();
  };

  const continueStep = () => {
    const errors = validateStep(form, step);
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }
    setFieldErrors({});
    setError("");
    if (step === 2) {
      setForm((current) => ({
        ...current,
        location: locatedSummary(current),
      }));
    }
    if (step === 3 && !form.title.trim()) {
      const suggested = suggestTitle(form);
      if (suggested) {
        setForm((current) => ({
          ...current,
          title: current.title.trim() || suggested,
        }));
      }
    }
    setStep((current) => Math.min(current + 1, 5));
  };

  const goTo = (target: number) => {
    const nextTarget = target;
    if (nextTarget === step) return;
    if (nextTarget < step) {
      setFieldErrors({});
      setError("");
      setStep(nextTarget);
      return;
    }
    for (let index = step; index < nextTarget; index += 1) {
      const errors = validateStep(form, index);
      if (Object.keys(errors).length > 0) {
        if (index !== step) setStep(index);
        showErrors(errors);
        return;
      }
    }
    if (nextTarget > 2) {
      setForm((current) => ({
        ...current,
        location: locatedSummary(current) || current.location,
        title: current.title.trim() || suggestTitle(current),
      }));
    }
    setFieldErrors({});
    setError("");
    setStep(nextTarget);
  };

  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  useEffect(() => {
    if (!wizardBackRef) return;
    wizardBackRef.current = () => {
      if (step <= 1) return false;
      goToRef.current(step - 1);
      return true;
    };
    return () => {
      wizardBackRef.current = null;
    };
  }, [step, wizardBackRef]);

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const invalid = selected.filter(
      (file) => !PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES,
    );
    const accepted = selected.filter(
      (file) => PHOTO_TYPES.has(file.type) && file.size <= MAX_PHOTO_BYTES && file.size > 0,
    );
    if (invalid.length > 0) {
      setError("Use JPEG, PNG, or WebP photos up to 5 MB each.");
    } else {
      setError("");
    }
    if (!accepted.length) return;

    setUploading(true);
    try {
      const { urls } = await api.uploadPhotos(accepted);
      setForm((current) => ({ ...current, photoUrls: [...current.photoUrls, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setForm((current) => ({
      ...current,
      photoUrls: current.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const cancelForm = () => {
    savedRef.current = true;
    sessionStorage.removeItem(NEW_PROPERTY_DRAFT);
    onCancel?.();
  };

  const saveProperty = async () => {
    for (let index = 1; index <= 5; index += 1) {
      const errors = validateStep(form, index);
      if (Object.keys(errors).length > 0) {
        setStep(index);
        showErrors(errors);
        return;
      }
    }

    const payload: PropertyFormData = {
      ...form,
      location: locatedSummary(form) || form.location.trim(),
      title: form.title.trim() || suggestTitle(form),
      configuration: configurationFromListing(form) || null,
      area: areaSummary(form),
      preferredTenant: form.preferredTenants.join(",") || form.preferredTenant,
    };

    setFieldErrors({});
    setError("");
    setLoading(true);
    try {
      await onSubmit(payload);
      savedRef.current = true;
      sessionStorage.removeItem(NEW_PROPERTY_DRAFT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const applyPlace = (place: PlaceHit, focus: "city" | "locality") => {
    setPin({ lat: place.lat, lon: place.lon });
    setForm((current) => {
      const city = place.city || (focus === "city" ? place.name : current.city);
      const pickedLocality = place.locality || (focus === "locality" ? place.name : "");
      const locality =
        focus === "locality"
          ? pickedLocality || current.locality
          : pickedLocality && !samePlace(pickedLocality, city)
            ? pickedLocality
            : current.locality;
      return {
        ...current,
        city,
        locality,
        subLocality:
          place.subLocality && !samePlace(place.subLocality, locality) && !samePlace(place.subLocality, city)
            ? place.subLocality
            : current.subLocality,
      };
    });
    clearError("city");
    clearError("locality");
  };

  const applyPin = async (lat: number, lon: number) => {
    setPin({ lat, lon });
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        city?: string;
        locality?: string;
        subLocality?: string;
      };
      setForm((current) => ({
        ...current,
        city: data.city || current.city,
        locality: data.locality || current.locality,
        subLocality: data.subLocality || current.subLocality,
      }));
      clearError("city");
      if (data.locality) clearError("locality");
    } catch {
      // The pin still marks the spot if the address lookup fails.
    }
  };

  const residential = form.category === "residential";
  const rentListing = residential && form.intent === "rent";
  const residentialBuilderFloor = isResidentialBuilderFloor(form);
  const residentialPlot = isResidentialPlot(form);
  const residentialSaleProfile = isResidentialSaleProfile(form);
  const officeListing = isOfficeListing(form);
  const retailShopMall = isRetailShopMall(form);
  const commercialLand = isCommercialLand(form);
  const genericCommercial = isGenericCommercial(form);
  const guidedDetails =
    rentListing ||
    residentialBuilderFloor ||
    residentialPlot ||
    officeListing ||
    retailShopMall ||
    commercialLand ||
    genericCommercial;

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        const target = event.target;
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement) return;
        event.preventDefault();
      }}
      className="space-y-4"
    >
      <div>
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              aria-label={item.label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                item.id <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <h2 className="font-serif text-[22px] font-medium leading-tight text-primary">
            {step === 3 && guidedDetails
              ? "Tell us about your property"
              : STEP_TITLES[step - 1]}
          </h2>
          <p className="shrink-0 text-[12px] font-medium text-muted">
            {step} / {STEPS.length}
          </p>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {step === 3 && rentListing && !residentialBuilderFloor && !residentialPlot
            ? "Add area, rooms, and the rent tenants will pay."
            : step === 3 && residentialBuilderFloor
              ? "Add the floor, area, rooms, and price."
              : step === 3 && residentialPlot
                ? "Add the plot area, dimensions, and price."
                : step === 3 && residentialSaleProfile
                  ? "Add rooms, area, furnishing, and price."
                  : step === 3 && officeListing && form.officeType === "bare-shell"
                    ? "Add area, availability, and the expected price."
                    : step === 3 && officeListing && form.officeType === "co-working"
                      ? "Add area, washrooms, and the expected price."
                      : step === 3 && officeListing
                        ? "Add area, office details, and the expected price."
                        : step === 3 && retailShopMall
                          ? "Add carpet area, shop details, and the expected price."
                          : step === 3 && commercialLand
                            ? "Add plot area, dimensions, and the expected price."
                            : step === 3 && genericCommercial
                              ? "Add area, washrooms, and the expected price."
                              : step === 3 && form.category === "commercial"
                    ? "Add area, possession, and other property details."
                    : STEP_HINTS[step - 1]}
        </p>
      </div>

      {error && <FormMessage>{error}</FormMessage>}

      <div className="space-y-5 rounded-[14px] border border-border/70 bg-surface p-4 shadow-sm">
      {step === 1 && form.category !== "commercial" && (
        <>
          <Choices
            label="And it's a *"
            value={form.category}
            options={PROPERTY_CATEGORIES}
            onChange={setCategory}
            error={fieldErrors.category}
            columns={2}
          />
          {residential && (
            <ResidentialDetails
              form={form}
              intentError={fieldErrors.intent}
              typeError={fieldErrors.propertyType}
              onIntent={setIntent}
              onType={setPropertyType}
            />
          )}
        </>
      )}

      {step === 1 && form.category === "commercial" && (
        <CommercialDetails
          form={form}
          intentError={fieldErrors.intent}
          categoryError={fieldErrors.category}
          typeError={fieldErrors.propertyType}
          officeTypeError={fieldErrors.officeType}
          retailTypeError={fieldErrors.retailType}
          shopLocationError={fieldErrors.shopLocation}
          plotTypeError={fieldErrors.plotType}
          storageTypeError={fieldErrors.storageType}
          onIntent={setIntent}
          onCategory={setCategory}
          onType={setPropertyType}
          onOfficeType={(value) => update("officeType", value)}
          onRetailType={(value) => {
            update("retailType", value);
            if (value !== "Commercial Shops") {
              setForm((current) => {
                const next = { ...current, retailType: value };
                clearRetailShop(next);
                return next;
              });
            }
          }}
          onShopLocation={(value) => {
            setForm((current) => {
              const next = { ...current, shopLocation: value };
              const keepsShopForm =
                value === "mall" || (current.intent === "sell" && value === "commercial-project");
              if (!keepsShopForm) clearRetailShop(next);
              if (value !== "commercial-project") next.plotArea = "";
              return next;
            });
            clearError("shopLocation");
          }}
          onIndustryType={(value) => update("industryType", value)}
          onHospitalityType={(value) => update("hospitalityType", value)}
          onPlotType={(value) => {
            setForm((current) => {
              const next = { ...current, plotType: value };
              if (value !== "commercial-land") clearCommercialLandLease(next);
              return next;
            });
            clearError("plotType");
          }}
          onStorageType={(value) => update("storageType", value)}
        />
      )}

      {step === 2 && (
        <>
          <PlaceSearch
            label="City *"
            value={form.city}
            kind="city"
            placeholder="Search a city"
            error={fieldErrors.city}
            onChange={(value) => update("city", value)}
            onSelect={(place) => applyPlace(place, "city")}
          />
          <div>
            {/* <p className="mb-2 text-[13px] font-medium text-foreground">Map</p>
            <LocationPickerMap
              lat={pin?.lat ?? null}
              lon={pin?.lon ?? null}
              onPick={(lat, lon) => {
                void applyPin(lat, lon);
              }}
            />
            <p className="mt-1.5 text-[12px] text-muted">
              Search a city, or tap the map to drop the pin.
            </p> */}
          </div>
          <PlaceSearch
            label="Locality *"
            value={form.locality}
            kind="place"
            near={form.city}
            placeholder={form.city ? `Search in ${form.city}` : "Search a locality"}
            error={fieldErrors.locality}
            onChange={(value) => update("locality", value)}
            onSelect={(place) => applyPlace(place, "locality")}
          />
          <Field
            label="Sub Locality (Optional)"
            value={form.subLocality}
            onChange={(value) => update("subLocality", value)}
          />
          <Field
            label="Apartment / Society"
            value={form.society}
            onChange={(value) => update("society", value)}
            placeholder="Opera Chandigarh Enclave"
          />
          <Field
            label="House No. (Optional)"
            value={form.houseNumber}
            onChange={(value) => update("houseNumber", value)}
          />
        </>
      )}

      {step === 3 && rentListing && !residentialBuilderFloor && !residentialPlot && (
        <RentProfile
          form={form}
          areaError={fieldErrors.area}
          priceError={fieldErrors.price}
          onBedrooms={(value) => {
            setForm((current) => {
              const next = { ...current, bedrooms: value };
              const config = current.configuration.trim();
              const bhkConfigs = new Set(["", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"]);
              if (bhkConfigs.has(config) || /^\d+ BHK$/.test(config)) {
                next.configuration = value ? `${value} BHK` : "";
              }
              return next;
            });
          }}
          onChange={update}
        />
      )}

      {step === 3 && residentialSaleProfile && (
        <ResidentialProfile
          form={form}
          priceError={fieldErrors.price}
          onBedrooms={(value) => {
            setForm((current) => {
              const next = { ...current, bedrooms: value };
              const config = current.configuration.trim();
              const bhkConfigs = new Set(["", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "6 BHK"]);
              if (bhkConfigs.has(config) || /^\d+ BHK$/.test(config)) {
                next.configuration = value === "5+" ? "5 BHK" : `${value} BHK`;
              }
              return next;
            });
          }}
          onChange={update}
          onToggleAmenity={(id) => toggleList("amenities", id)}
        />
      )}

      {step === 3 && residentialPlot && (
        <ResidentialPlotProfile
          form={form}
          priceError={fieldErrors.price}
          onChange={update}
          onConstruction={setConstructionDone}
        />
      )}

      {step === 3 && residentialBuilderFloor && (
        <ResidentialBuilderFloorProfile
          form={form}
          priceError={fieldErrors.price}
          onChange={update}
          onPossession={setBuilderPossession}
        />
      )}

      {step === 3 && officeListing && form.officeType === "bare-shell" && (
        <BareShellOfficeProfile
          form={form}
          priceError={fieldErrors.price}
          rentError={fieldErrors.currentRent}
          onChange={update}
        />
      )}

      {step === 3 && officeListing && form.officeType === "co-working" && (
        <CoWorkingOfficeProfile
          form={form}
          areaError={fieldErrors.area}
          priceError={fieldErrors.price}
          rentError={fieldErrors.currentRent}
          onChange={update}
        />
      )}

      {step === 3 && officeListing && form.officeType !== "bare-shell" && form.officeType !== "co-working" && (
        <OfficeProfile
          form={form}
          priceError={fieldErrors.price}
          rentError={fieldErrors.currentRent}
          onChange={update}
        />
      )}

      {step === 3 && retailShopMall && (
        <RetailShopMallProfile
          form={form}
          areaError={fieldErrors.area}
          priceError={fieldErrors.price}
          rentError={fieldErrors.currentRent}
          onChange={update}
        />
      )}

      {step === 3 && commercialLand && (
        <CommercialLandProfile
          form={form}
          priceError={fieldErrors.price}
          rentError={fieldErrors.currentRent}
          onChange={update}
        />
      )}

      {step === 3 && genericCommercial && (
        <CommercialProfile
          form={form}
          areaError={fieldErrors.area}
          priceError={fieldErrors.price}
          rentError={fieldErrors.currentRent}
          onChange={update}
        />
      )}

      {step === 4 && (
        <div>
          <div className="flex flex-wrap gap-2">
            {form.photoUrls.map((url, i) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg">
                <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1.5 text-xs text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background text-muted"
            >
              {uploading ? (
                <Spinner size={24} className="text-muted" />
              ) : (
                <Plus size={24} />
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handlePhotos(e.target.files)}
          />
        </div>
      )}

      {step === 5 && (
        <>
          <Field
            label="Property Name *"
            value={form.title}
            onChange={(value) => update("title", value)}
            error={fieldErrors.title}
          />
          {!rentListing && !residentialBuilderFloor && !residentialPlot && !officeListing && !retailShopMall && !commercialLand && !genericCommercial && (
            <>
              {!residentialSaleProfile && (
                <PriceField
                  value={form.price}
                  onChange={(value) => update("price", value)}
                  label={form.intent === "rent" ? "Monthly rent *" : "Price *"}
                  error={fieldErrors.price}
                />
              )}
              <CheckField
                label="Price is negotiable"
                checked={form.negotiable}
                onChange={(checked) => update("negotiable", checked)}
              />
              {form.intent === "rent" && (
                <>
                  <Field
                    label="Security deposit"
                    value={form.deposit}
                    onChange={(value) => update("deposit", value)}
                    placeholder="e.g. 2 months"
                  />
                  <SelectField
                    label="Preferred tenant"
                    value={form.preferredTenant}
                    onChange={(value) => update("preferredTenant", value)}
                    options={TENANT_OPTIONS}
                    placeholder="Select tenant type"
                  />
                </>
              )}
              <Field
                label="Maintenance"
                value={form.maintenance}
                onChange={(value) => update("maintenance", value)}
                placeholder="Monthly charges"
              />
            </>
          )}
          {!residential && (
            <SelectField
              label="Ownership"
              value={form.ownership}
              onChange={(value) => update("ownership", value)}
              options={OWNERSHIP_OPTIONS}
              placeholder="Select ownership"
            />
          )}
          <SelectField
            label="Posted as"
            value={form.postedAs}
            onChange={(value) => update("postedAs", value)}
            options={POSTED_AS_OPTIONS}
            placeholder="Select"
          />
          <SelectField
            label="Availability"
            value={form.availability}
            onChange={(value) => update("availability", value)}
            options={PROPERTY_AVAILABILITY_OPTIONS}
            allowEmpty={false}
          />
          {!residential && (
            <MultiChoices
              label="Amenities"
              values={form.amenities}
              options={amenityOptions(form.category)}
              onToggle={(id) => toggleList("amenities", id)}
            />
          )}
          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground">Notes</p>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className={fieldClass}
            />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={() => setCancelConfirmOpen(true)}
            className="flex-1 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground"
          >
            Cancel
          </button>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className="flex-1 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground"
          >
            Back
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={continueStep}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-foreground"
          >
            {step === 3 && guidedDetails ? "Post & continue" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || uploading}
            onClick={() => void saveProperty()}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {loading ? <ButtonLoader label="Saving…" /> : submitLabel}
          </button>
        )}
      </div>
      </div>
      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Cancel this property?"
        description="The details you entered will be discarded."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setCancelConfirmOpen(false);
          cancelForm();
        }}
        onCancel={() => setCancelConfirmOpen(false)}
      />
    </form>
  );
}
