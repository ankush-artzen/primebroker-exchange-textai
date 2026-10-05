"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { PropertyFormData } from "@/lib/types";
import { PriceField } from "@/components/PriceField";
import { formatArea, fromSqft, parseArea, toSqft, type AreaUnit } from "@/lib/area";
import { amountInWords } from "@/lib/price";
import {
  ADDITIONAL_ROOM_OPTIONS,
  FORM_AREA_UNITS,
  type FormAreaUnit,
  BALCONY_OPTIONS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  FACING_OPTIONS,
  FLOORING_OPTIONS,
  FURNISHING_OPTIONS,
  LISTING_INTENTS,
  OPEN_SIDE_OPTIONS,
  OWNERSHIP_OPTIONS,
  POSSESSION_OPTIONS,
  POSTED_AS_OPTIONS,
  POWER_BACKUP_OPTIONS,
  PROPERTY_AGE_OPTIONS,
  RENT_AGE_OPTIONS,
  RENT_BALCONY_OPTIONS,
  RENT_FURNISHING_OPTIONS,
  RENT_TENANT_OPTIONS,
  PROPERTY_AVAILABILITY_OPTIONS,
  PROPERTY_CATEGORIES,
  RESIDENTIAL_LISTING_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
  TENANT_OPTIONS,
  WATER_SOURCE_OPTIONS,
  YES_NO_OPTIONS,
  amenityOptions,
  getConfigurationOptions,
  getPropertyTypeOptions,
  isLandType,
  propertyTypeLabel,
  showsBedrooms,
  showsPropertyFloor,
  showsRoomDetails,
} from "@/lib/constants/property";
import {
  configurationFromListing,
  suggestTitle,
} from "@/lib/property-listing";
import {
  fieldErrorBorder,
  fieldErrorText,
  formatMissingFieldsSummary,
  scrollToFirstFieldError,
  formErrorBanner,
} from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { ButtonLoader, Spinner } from "@/components/Loader";
import { PlaceSearch, type PlaceHit } from "@/components/PlaceSearch";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { api } from "@/lib/api";

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

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/25";

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
  | "city"
  | "locality"
  | "location"
  | "title"
  | "price"
  | "area";

type ListingDraft = {
  title: string;
  location: string;
  price: string;
  configuration: string;
  area: string;
  availability: string;
  notes: string;
  photoUrls: string[];
  intent: string;
  category: string;
  propertyType: string;
  city: string;
  locality: string;
  subLocality: string;
  society: string;
  houseNumber: string;
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  additionalRooms: string[];
  furnishing: string;
  totalFloors: string;
  propertyFloor: string;
  possession: string;
  propertyAge: string;
  possessionBy: string;
  areaType: string;
  carpetArea: string;
  plotArea: string;
  builtUpArea: string;
  facing: string;
  powerBackup: string;
  flooring: string;
  coveredParking: string;
  openParking: string;
  waterSource: string;
  ownership: string;
  postedAs: string;
  negotiable: boolean;
  maintenance: string;
  deposit: string;
  preferredTenant: string;
  preferredTenants: string[];
  availableFrom: string;
  brokerContact: string;
  chargesExcluded: boolean;
  plotLength: string;
  plotBreadth: string;
  boundaryWall: string;
  openSides: string;
  floorsAllowed: string;
  constructionDone: string;
  amenities: string[];
};

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
  facing: "",
  powerBackup: "",
  flooring: "",
  coveredParking: "",
  openParking: "",
  waterSource: "",
  ownership: "",
  postedAs: "broker",
  negotiable: false,
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

function rentDigits(value: string) {
  if (/lakh|crore|thousand/i.test(value)) return "";
  return value.replace(/[^\d]/g, "");
}

function formatRent(amount: string) {
  const digits = amount.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `₹${Number(digits).toLocaleString("en-IN")}`;
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
    facing: text(initial?.facing),
    powerBackup: text(initial?.powerBackup),
    flooring: text(initial?.flooring),
    coveredParking: text(initial?.coveredParking),
    openParking: text(initial?.openParking),
    waterSource: text(initial?.waterSource),
    ownership: text(initial?.ownership),
    postedAs: initial?.postedAs || "broker",
    negotiable: Boolean(initial?.negotiable),
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
    amenities: initial?.amenities ?? [],
  };
}

interface Props {
  initial?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function PropertyForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Property",
}: Props) {
  const keepDraft = !initial;
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null);
  const [form, setForm] = useState<ListingDraft>(() => fromInitial(initial));
  const [draftReady, setDraftReady] = useState(!keepDraft);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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
      field === "city" ||
      field === "locality" ||
      field === "location" ||
      field === "title" ||
      field === "price"
    ) {
      clearError(field);
    } else if (field === "carpetArea" || field === "plotArea" || field === "builtUpArea") {
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
      amenities: current.amenities.filter((id) =>
        amenityOptions(category).some((option) => option.id === id),
      ),
    }));
    clearError("category");
    clearError("propertyType");
  };

  const setPropertyType = (propertyType: string) => {
    setForm((current) => {
      const next = { ...current, propertyType };
      if (current.category === "residential") return next;
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
  };

  const setPossession = (possession: string) => {
    setForm((current) => ({
      ...current,
      possession,
      propertyAge: possession === "ready" ? current.propertyAge : "",
      possessionBy: possession === "under-construction" ? current.possessionBy : "",
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
    }
    if (target === 2) {
      if (!current.city.trim()) errors.city = "City is required";
      if (!current.locality.trim()) errors.locality = "Locality is required";
    }
    if (
      target === 3 &&
      current.category === "residential" &&
      current.intent === "rent"
    ) {
      if (!current.carpetArea.trim() && !current.plotArea.trim() && !current.builtUpArea.trim()) {
        errors.area = "At least one area type is mandatory.";
      }
      if (!rentDigits(current.price)) errors.price = "Expected rent is required";
    }
    if (target === 5) {
      const title = current.title.trim() || suggestTitle(current);
      if (!title) errors.title = "Property name is required";
      if (!current.price.trim()) errors.price = "Price is required";
    }
    return errors;
  };

  const showErrors = (errors: Partial<Record<StepField, string>>) => {
    const labels: Record<StepField, string> = {
      intent: "Sell or rent",
      category: "Residential or commercial",
      propertyType: "Property type",
      city: "City",
      locality: "Locality",
      location: "Location",
      title: "Property Name",
      price: "Expected rent",
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
    setStep((current) => {
      let next = Math.min(current + 1, 5);
      if (form.category === "commercial" && next === 3) next = 4;
      return next;
    });
  };

  const goTo = (target: number) => {
    let nextTarget = target;
    if (form.category === "commercial" && nextTarget === 3) {
      nextTarget = target > step ? 4 : 2;
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      continueStep();
      return;
    }

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

  const roomDetails = showsRoomDetails(form.propertyType);
  const land = isLandType(form.propertyType);
  const residential = form.category === "residential";
  const rentListing = residential && form.intent === "rent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            {step === 3 && rentListing ? "Tell us about your property" : STEP_TITLES[step - 1]}
          </h2>
          <p className="shrink-0 text-[12px] font-medium text-muted">
            {step} / {STEPS.length}
          </p>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {step === 3 && rentListing
            ? "Add area, rooms, and the rent tenants will pay."
            : STEP_HINTS[step - 1]}
        </p>
      </div>

      {error && <p className={formErrorBanner}>{error}</p>}

      <div className="space-y-5 rounded-[14px] border border-border/70 bg-surface p-4 shadow-sm">
      {step === 1 && (
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
          {form.category === "commercial" && (
            <>
          <Choices
            label="You're looking to *"
            value={form.intent}
            options={LISTING_INTENTS}
            onChange={setIntent}
            error={fieldErrors.intent}
          />
          <SelectField
            label="Property type *"
            value={form.propertyType}
            onChange={setPropertyType}
            options={getPropertyTypeOptions(form.category, form.propertyType)}
            placeholder={
              form.category
                ? "Select property type"
                : "Choose residential or commercial first"
            }
            disabled={!form.category}
            error={fieldErrors.propertyType}
          />
          <SelectField
            label="Configuration"
            value={form.configuration}
            onChange={(value) => update("configuration", value)}
            options={getConfigurationOptions(form.configuration).map((option) => ({
              id: option,
              label: option,
            }))}
            placeholder="Select configuration"
          />

          {showsBedrooms(form.propertyType) && (
            <Choices
              label="Bedrooms"
              value={form.bedrooms}
              options={BEDROOM_OPTIONS}
              onChange={(value) => {
                setForm((current) => {
                  const next = { ...current, bedrooms: value };
                  const config = current.configuration.trim();
                  const bhkConfigs = new Set(["", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"]);
                  if (bhkConfigs.has(config)) {
                    next.configuration = value === "5+" ? "5 BHK" : `${value} BHK`;
                  }
                  return next;
                });
              }}
            />
          )}

          {roomDetails && (
            <>
              <Choices
                label={residential ? "Bathrooms" : "Washrooms"}
                value={form.bathrooms}
                options={BATHROOM_OPTIONS}
                onChange={(value) => update("bathrooms", value)}
              />
              {residential && (
                <Choices
                  label="Balconies"
                  value={form.balconies}
                  options={BALCONY_OPTIONS}
                  onChange={(value) => update("balconies", value)}
                />
              )}
              {residential && (
                <MultiChoices
                  label="Other rooms"
                  values={form.additionalRooms}
                  options={ADDITIONAL_ROOM_OPTIONS}
                  onToggle={(id) => toggleList("additionalRooms", id)}
                />
              )}
              <SelectField
                label="Furnishing"
                value={form.furnishing}
                onChange={(value) => update("furnishing", value)}
                options={FURNISHING_OPTIONS}
                placeholder="Select furnishing"
              />
              <Field
                label="Total floors"
                value={form.totalFloors}
                onChange={(value) => update("totalFloors", value)}
                inputMode="numeric"
              />
              {showsPropertyFloor(form.propertyType) && (
                <Field
                  label="Property on floor"
                  value={form.propertyFloor}
                  onChange={(value) => update("propertyFloor", value)}
                  inputMode="numeric"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Covered parking"
                  value={form.coveredParking}
                  onChange={(value) => update("coveredParking", value)}
                  inputMode="numeric"
                />
                <Field
                  label="Open parking"
                  value={form.openParking}
                  onChange={(value) => update("openParking", value)}
                  inputMode="numeric"
                />
              </div>
              {residential && (
                <SelectField
                  label="Water source"
                  value={form.waterSource}
                  onChange={(value) => update("waterSource", value)}
                  options={WATER_SOURCE_OPTIONS}
                  placeholder="Select water source"
                />
              )}
            </>
          )}

          {land && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Length"
                  value={form.plotLength}
                  onChange={(value) => update("plotLength", value)}
                  inputMode="decimal"
                />
                <Field
                  label="Breadth"
                  value={form.plotBreadth}
                  onChange={(value) => update("plotBreadth", value)}
                  inputMode="decimal"
                />
              </div>
              <Field
                label="Floors allowed"
                value={form.floorsAllowed}
                onChange={(value) => update("floorsAllowed", value)}
                inputMode="numeric"
              />
              <Choices
                label="Boundary wall"
                value={form.boundaryWall}
                options={YES_NO_OPTIONS}
                onChange={(value) => update("boundaryWall", value)}
              />
              <Choices
                label="Open sides"
                value={form.openSides}
                options={OPEN_SIDE_OPTIONS}
                onChange={(value) => update("openSides", value)}
              />
              <Choices
                label="Any construction done"
                value={form.constructionDone}
                options={YES_NO_OPTIONS}
                onChange={(value) => update("constructionDone", value)}
              />
            </>
          )}

          <AreaFields
            carpetArea={form.carpetArea}
            plotArea={form.plotArea}
            builtUpArea={form.builtUpArea}
            onChange={update}
          />
          <Choices
            label="Possession"
            value={form.possession}
            options={POSSESSION_OPTIONS}
            onChange={setPossession}
          />
          {form.possession === "ready" && (
            <SelectField
              label="Age of property"
              value={form.propertyAge}
              onChange={(value) => update("propertyAge", value)}
              options={PROPERTY_AGE_OPTIONS}
              placeholder="Select age"
            />
          )}
          {form.possession === "under-construction" && (
            <Field
              label="Possession by"
              value={form.possessionBy}
              onChange={(value) => update("possessionBy", value)}
              type="month"
            />
          )}
          {roomDetails && (
            <SelectField
              label="Facing"
              value={form.facing}
              onChange={(value) => update("facing", value)}
              options={FACING_OPTIONS}
              placeholder="Select facing"
            />
          )}
            </>
          )}
        </>
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

      {step === 3 && rentListing && (
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

      {step === 3 && residential && !rentListing && (
        <ResidentialProfile
          form={form}
          onBedrooms={(value) => {
            setForm((current) => {
              const next = { ...current, bedrooms: value };
              const config = current.configuration.trim();
              const bhkConfigs = new Set(["", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"]);
              if (bhkConfigs.has(config)) {
                next.configuration = value === "5+" ? "5 BHK" : `${value} BHK`;
              }
              return next;
            });
          }}
          onChange={update}
          onToggleAmenity={(id) => toggleList("amenities", id)}
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
          {!rentListing && (
            <>
              <PriceField
                value={form.price}
                onChange={(value) => update("price", value)}
                label={form.intent === "rent" ? "Monthly rent *" : "Price *"}
                error={fieldErrors.price}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.negotiable}
                  onChange={(e) => update("negotiable", e.target.checked)}
                  className="h-4 w-4 accent-[#D4AF37]"
                />
                Price is negotiable
              </label>
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
        {step === 1 && onCancel && (
          <button
            type="button"
            onClick={onCancel}
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
            {step === 3 && rentListing ? "Post & continue" : "Continue"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {loading ? <ButtonLoader label="Saving…" /> : submitLabel}
          </button>
        )}
      </div>
      </div>
    </form>
  );
}

function ResidentialDetails({
  form,
  intentError,
  typeError,
  onIntent,
  onType,
}: {
  form: ListingDraft;
  intentError?: string;
  typeError?: string;
  onIntent: (value: string) => void;
  onType: (value: string) => void;
}) {
  const typeOptions =
    !form.propertyType ||
    RESIDENTIAL_PROPERTY_TYPES.some((option) => option.id === form.propertyType)
      ? RESIDENTIAL_PROPERTY_TYPES
      : [
          {
            id: form.propertyType,
            label: propertyTypeLabel("residential", form.propertyType),
          },
          ...RESIDENTIAL_PROPERTY_TYPES,
        ];

  return (
    <>
      <Choices
        label="Listing type *"
        value={form.intent}
        options={RESIDENTIAL_LISTING_TYPES}
        onChange={onIntent}
        error={intentError}
        columns={2}
      />
      <Choices
        label="Property type *"
        value={form.propertyType}
        options={typeOptions}
        onChange={onType}
        error={typeError}
      />
    </>
  );
}

function RentProfile({
  form,
  onBedrooms,
  onChange,
  areaError,
  priceError,
}: {
  form: ListingDraft;
  onBedrooms: (value: string) => void;
  onChange: <K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) => void;
  areaError?: string;
  priceError?: string;
}) {
  const [moreRent, setMoreRent] = useState(
    Boolean(form.deposit.trim() || form.maintenance.trim()),
  );
  const words = amountInWords(form.price);

  const toggleTenant = (id: string) => {
    const selected = form.preferredTenants.includes(id);
    if (id === "anyone") {
      onChange("preferredTenants", selected ? [] : ["anyone"]);
      return;
    }
    const next = selected
      ? form.preferredTenants.filter((item) => item !== id)
      : [...form.preferredTenants.filter((item) => item !== "anyone"), id];
    onChange("preferredTenants", next);
  };

  return (
    <>
      <div data-field-error={areaError ? "true" : undefined}>
        <p className="text-sm font-semibold text-foreground">Add Area Details</p>
        <p className="mt-0.5 text-[12px] text-muted">At least one area type is mandatory.</p>
        <div className="mt-3 space-y-4">
          <AreaMeasureField
            label="Plot Area"
            value={form.plotArea}
            onChange={(value) => onChange("plotArea", value)}
          />
          <AreaMeasureField
            label="Carpet Area"
            value={form.carpetArea}
            onChange={(value) => onChange("carpetArea", value)}
          />
          <AreaMeasureField
            label="Built-up Area"
            value={form.builtUpArea}
            onChange={(value) => onChange("builtUpArea", value)}
          />
        </div>
        {areaError && <p className={fieldErrorText}>{areaError}</p>}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Add Room Details</p>
        <div className="mt-3 space-y-4">
          <RoomCount
            label="No. of Bedrooms"
            value={form.bedrooms}
            maxChip={4}
            onChange={onBedrooms}
          />
          <RoomCount
            label="No. of Bathrooms"
            value={form.bathrooms}
            maxChip={4}
            onChange={(value) => onChange("bathrooms", value)}
          />
          <Choices
            label="Balconies"
            value={form.balconies}
            options={RENT_BALCONY_OPTIONS}
            onChange={(value) => onChange("balconies", value)}
          />
        </div>
      </div>

      <Choices
        label="Furnishing"
        value={form.furnishing}
        options={RENT_FURNISHING_OPTIONS}
        onChange={(value) => onChange("furnishing", value)}
      />

      <div>
        <p className="text-sm font-semibold text-foreground">Floor Details</p>
        <p className="mt-0.5 text-[12px] text-muted">
          Total no of floors and your floor details.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field
            label="Total floors"
            value={form.totalFloors}
            onChange={(value) => onChange("totalFloors", value)}
            type="number"
            inputMode="numeric"
          />
          <Field
            label="Your floor"
            value={form.propertyFloor}
            onChange={(value) => onChange("propertyFloor", value)}
            type="number"
            inputMode="numeric"
          />
        </div>
      </div>

      <Choices
        label="Age of property"
        value={form.propertyAge}
        options={RENT_AGE_OPTIONS}
        onChange={(value) => onChange("propertyAge", value)}
      />

      <Field
        label="Available from"
        value={form.availableFrom}
        onChange={(value) => onChange("availableFrom", value)}
        type="date"
      />

      <MultiChoices
        label="Willing to rent out to"
        values={form.preferredTenants}
        options={RENT_TENANT_OPTIONS}
        onToggle={toggleTenant}
      />

      <div data-field-error={priceError ? "true" : undefined}>
        <p className="text-sm font-semibold text-foreground">Rent Details</p>
        <div className="mt-3">
          <Field
            label="Price (Monthly per flat) *"
            value={rentDigits(form.price)}
            onChange={(value) => onChange("price", formatRent(value))}
            placeholder="Expected Rent"
            type="number"
            inputMode="numeric"
            error={priceError}
          />
          {words && <p className="mt-1.5 text-[12px] text-muted">{words}</p>}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={form.chargesExcluded}
            onChange={(e) => onChange("chargesExcluded", e.target.checked)}
            className="h-4 w-4 accent-[#D4AF37]"
          />
          Electricity & Water charges excluded
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => onChange("negotiable", e.target.checked)}
            className="h-4 w-4 accent-[#D4AF37]"
          />
          Price Negotiable
        </label>
        <button
          type="button"
          onClick={() => setMoreRent((open) => !open)}
          className="mt-3 text-sm font-medium text-primary"
        >
          {moreRent ? "Hide rent details" : "+ Add more Rent details"}
        </button>
        {moreRent && (
          <div className="mt-3 space-y-4">
            <Field
              label="Security deposit"
              value={form.deposit}
              onChange={(value) => onChange("deposit", value)}
              placeholder="e.g. 2 months"
            />
            <Field
              label="Maintenance"
              value={form.maintenance}
              onChange={(value) => onChange("maintenance", value)}
              placeholder="Monthly charges"
            />
          </div>
        )}
      </div>

      <Choices
        label="Are you ok with brokers contacting you?"
        value={form.brokerContact}
        options={YES_NO_OPTIONS}
        onChange={(value) => onChange("brokerContact", value)}
        columns={2}
      />
    </>
  );
}

function RoomCount({
  label,
  value,
  maxChip,
  onChange,
}: {
  label: string;
  value: string;
  maxChip: number;
  onChange: (value: string) => void;
}) {
  const options = Array.from({ length: maxChip }, (_, index) => {
    const id = String(index + 1);
    return { id, label: id };
  });
  const custom = value !== "" && !options.some((option) => option.id === value);
  const [open, setOpen] = useState(custom);

  return (
    <div>
      <Choices
        label={label}
        value={custom ? "" : value}
        options={options}
        onChange={(next) => {
          setOpen(false);
          onChange(next);
        }}
        columns={4}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-medium text-primary"
      >
        + Add other
      </button>
      {open && (
        <input
          type="number"
          inputMode="numeric"
          min={maxChip + 1}
          value={custom ? value : ""}
          placeholder="Enter number"
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "mt-2")}
        />
      )}
    </div>
  );
}

function ResidentialProfile({
  form,
  onBedrooms,
  onChange,
  onToggleAmenity,
}: {
  form: ListingDraft;
  onBedrooms: (value: string) => void;
  onChange: <K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) => void;
  onToggleAmenity: (id: string) => void;
}) {
  return (
    <>
      <AreaFields
        carpetArea={form.carpetArea}
        plotArea={form.plotArea}
        builtUpArea={form.builtUpArea}
        onChange={onChange}
      />
      <Choices
        label="Bedrooms"
        value={form.bedrooms}
        options={BEDROOM_OPTIONS}
        onChange={onBedrooms}
        columns={5}
      />
      <Choices
        label="Bathrooms"
        value={form.bathrooms}
        options={BATHROOM_OPTIONS}
        onChange={(value) => onChange("bathrooms", value)}
        columns={4}
      />
      <Choices
        label="Balconies"
        value={form.balconies}
        options={BALCONY_OPTIONS}
        onChange={(value) => onChange("balconies", value)}
        columns={4}
      />
      <div>
        <p className="mb-2 text-[13px] font-medium text-foreground">Floor / Total floors</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.propertyFloor}
            placeholder="Floor"
            onChange={(e) => onChange("propertyFloor", e.target.value)}
            className={fieldClass}
          />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.totalFloors}
            placeholder="Total floors"
            onChange={(e) => onChange("totalFloors", e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <Choices
        label="Furnishing"
        value={form.furnishing}
        options={FURNISHING_OPTIONS}
        onChange={(value) => onChange("furnishing", value)}
      />
      <Choices
        label="Facing"
        value={form.facing}
        options={FACING_OPTIONS}
        onChange={(value) => onChange("facing", value)}
        columns={4}
      />
      <Choices
        label="Power backup"
        value={form.powerBackup}
        options={POWER_BACKUP_OPTIONS}
        onChange={(value) => onChange("powerBackup", value)}
      />
      <div>
        <p className="mb-2 text-[13px] font-medium text-foreground">Reserved parking</p>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <CountStepper
            label="Covered"
            value={form.coveredParking}
            onChange={(value) => onChange("coveredParking", value)}
          />
          <CountStepper
            label="Open"
            value={form.openParking}
            onChange={(value) => onChange("openParking", value)}
            divided
          />
        </div>
      </div>
      <Choices
        label="Ownership"
        value={form.ownership}
        options={OWNERSHIP_OPTIONS}
        onChange={(value) => onChange("ownership", value)}
      />
      <SelectField
        label="Flooring"
        value={form.flooring}
        onChange={(value) => onChange("flooring", value)}
        options={FLOORING_OPTIONS}
        placeholder="Select flooring"
      />
      <MultiChoices
        label="Amenities"
        values={form.amenities}
        options={amenityOptions("residential")}
        onToggle={onToggleAmenity}
      />
    </>
  );
}

function legacyAreas(initial?: Partial<PropertyFormData>) {
  const carpetArea = text(initial?.carpetArea);
  const plotArea = text(initial?.plotArea);
  const builtUpArea = text(initial?.builtUpArea);
  if (carpetArea || plotArea || builtUpArea) {
    return { carpetArea, plotArea, builtUpArea };
  }
  const area = text(initial?.area);
  const areaType = text(initial?.areaType);
  if (areaType === "plot") return { carpetArea: "", plotArea: area, builtUpArea: "" };
  if (areaType === "built-up" || areaType === "super-built-up") {
    return { carpetArea: "", plotArea: "", builtUpArea: area };
  }
  return { carpetArea: area, plotArea: "", builtUpArea: "" };
}

function areaSummary(input: Pick<ListingDraft, "carpetArea" | "plotArea" | "builtUpArea">) {
  return [
    input.carpetArea.trim() && `Carpet ${input.carpetArea.trim()}`,
    input.plotArea.trim() && `Plot ${input.plotArea.trim()}`,
    input.builtUpArea.trim() && `Built-up ${input.builtUpArea.trim()}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formAreaUnit(unit: AreaUnit): FormAreaUnit {
  if (unit === "gaj" || unit === "sq-yd") return "gaj";
  if (unit === "marla" || unit === "kanal") return unit;
  return "sq-ft";
}

function AreaFields({
  carpetArea,
  plotArea,
  builtUpArea,
  onChange,
}: {
  carpetArea: string;
  plotArea: string;
  builtUpArea: string;
  onChange: <K extends "carpetArea" | "plotArea" | "builtUpArea">(
    field: K,
    value: string,
  ) => void;
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

function AreaMeasureField({
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
    const amount = next.unit === "sq-yd" || nextUnit === next.unit
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

function CountStepper({
  label,
  value,
  onChange,
  divided,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  divided?: boolean;
}) {
  const count = Number.parseInt(value, 10);
  const current = Number.isFinite(count) && count > 0 ? count : 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5",
        divided && "border-t border-border",
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(current <= 1 ? "" : String(current - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground"
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums text-foreground">
          {current}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(String(current + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function Choices({
  label,
  value,
  options,
  onChange,
  error,
  columns,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
  columns?: 2 | 4 | 5;
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <div
        className={cn(
          columns ? "grid gap-1.5" : "flex flex-wrap gap-2",
          columns === 2 && "grid-cols-2",
          columns === 4 && "grid-cols-4",
          columns === 5 && "grid-cols-5",
        )}
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "border text-sm font-medium transition-colors",
                columns
                  ? "rounded-xl px-1 py-2.5 text-center"
                  : "rounded-full px-3.5 py-2",
                selected
                  ? "border-primary bg-primary text-foreground"
                  : "border-border bg-background text-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}

function MultiChoices({
  label,
  values,
  options,
  onToggle,
}: {
  label: string;
  values: string[];
  options: readonly { id: string; label: string }[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-secondary-tint text-secondary-dark"
                  : "border-border bg-background text-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, error && fieldErrorBorder, disabled && "opacity-60")}
      >
        {allowEmpty && <option value="">{placeholder ?? "Select"}</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <div data-field-error={error ? "true" : undefined}>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, error && fieldErrorBorder)}
      />
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}
