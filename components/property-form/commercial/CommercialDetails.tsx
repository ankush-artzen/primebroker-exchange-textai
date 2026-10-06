"use client";

import {
  COMMERCIAL_PROPERTY_TYPES,
  LISTING_INTENTS,
  OFFICE_TYPES,
  PROPERTY_CATEGORIES,
  propertyTypeLabel,
  RETAIL_TYPES,
  SHOP_LOCATIONS,
  PLOT_TYPES,
  STORAGE_TYPES,
  INDUSTRY_TYPES,
  HOSPITALITY_TYPES,
} from "@/lib/constants/property";
import { Choices } from "@/components/property-form/fields";
import type { ListingDraft } from "@/components/property-form/types";

export function CommercialDetails({
  form,
  intentError,
  categoryError,
  typeError,
  officeTypeError,
  onIntent,
  onCategory,
  onType,
  onOfficeType,
  onPlotType,
  onRetailType,
  onShopLocation,
  onStorageType,
  retailTypeError,
  shopLocationError,
  plotTypeError,
  storageTypeError,
  onIndustryType,
  onHospitalityType,
  industryTypeError,
  hospitalityTypeError,
}: {
  form: ListingDraft;
  intentError?: string;
  categoryError?: string;
  typeError?: string;
  officeTypeError?: string;
  retailTypeError?: string;
  shopLocationError?: string;
  onIntent: (value: string) => void;
  onCategory: (value: string) => void;
  onType: (value: string) => void;
  onOfficeType: (value: string) => void;
  onRetailType: (value: string) => void;
  onShopLocation: (value: string) => void;
  onStorageType: (value: string) => void;
  onPlotType: (value: string) => void;
  plotTypeError?: string;
  storageTypeError?: string;
  industryTypeError?: string;
  onIndustryType: (value: string) => void;
  hospitalityTypeError?: string;
  onHospitalityType: (value: string) => void;
}) {
  const typeOptions =
    !form.propertyType ||
    COMMERCIAL_PROPERTY_TYPES.some((option) => option.id === form.propertyType)
      ? COMMERCIAL_PROPERTY_TYPES
      : [
          {
            id: form.propertyType,
            label: propertyTypeLabel("commercial", form.propertyType),
          },
          ...COMMERCIAL_PROPERTY_TYPES,
        ];

  return (
    <>
      <Choices
        label="I'm looking to"
        value={form.intent}
        options={LISTING_INTENTS}
        onChange={onIntent}
        error={intentError}
        columns={2}
      />
      <Choices
        label="What kind of property do you have?"
        value={form.category}
        options={PROPERTY_CATEGORIES}
        onChange={onCategory}
        error={categoryError}
        columns={2}
      />
      <Choices
        label="Commercial Property Types"
        value={form.propertyType}
        options={typeOptions}
        onChange={onType}
        error={typeError}
      />
      {form.propertyType === "office" && (
        <Choices
          label="What kind of office is it?"
          value={form.officeType}
          options={OFFICE_TYPES}
          onChange={onOfficeType}
          error={officeTypeError}
        />
      )}
      {form.propertyType === "retail" && (
        <Choices
          label="What type of retail space do you have ?"
          value={form.retailType}
          options={RETAIL_TYPES}
          onChange={onRetailType}
          error={retailTypeError}
        />
      )}
      {form.propertyType === "retail" && form.retailType && (
        <Choices
          label="Your shop is located inside"
          value={form.shopLocation}
          options={SHOP_LOCATIONS}
          onChange={onShopLocation}
          error={shopLocationError}
        />
      )}
      {form.propertyType === "plot-land" && (
        <Choices
          label="What type of plot / land is it?"
          value={form.plotType}
          options={PLOT_TYPES}
          onChange={onPlotType}
          error={plotTypeError}
        />
      )}

      {form.propertyType === "storage" && (
        <Choices
          label="What kind of storage is it?"
          value={form.storageType}
          options={STORAGE_TYPES}
          onChange={onStorageType}
          error={storageTypeError}
        />
      )}

      {form.propertyType === "industry" && (
        <Choices
          label="What kind of industry is it?"
          value={form.industryType}
          options={INDUSTRY_TYPES}
          onChange={onIndustryType}
          error={industryTypeError}
          
        />
      )}
      {form.propertyType === "hospitality" && (  
        <Choices
          label="What kind of hospitality is it?"
          value={form.hospitalityType}
          options={HOSPITALITY_TYPES}
          onChange={onHospitalityType}
          error={hospitalityTypeError}
        />
      )}
    </>
  );
}
