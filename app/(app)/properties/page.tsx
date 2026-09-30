"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/lib/types";
import { api } from "@/lib/api";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailSheet } from "@/components/PropertyDetailSheet";
import { AddButton, AppPage } from "@/components/AppPage";
import { PropertyListSkeleton } from "@/components/Loader";
import { ListPagination } from "@/components/ListPagination";
import { usePagination } from "@/hooks/usePagination";
import { cn, getPropertyStatus } from "@/lib/utils";
import { House } from "lucide-react";

type PropertyFilter = "all" | "available" | "reserved" | "sold";

const filters: { id: PropertyFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "reserved", label: "Reserved" },
  { id: "sold", label: "Sold" },
];

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Property | null>(null);
  const [filter, setFilter] = useState<PropertyFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      if (filter === "all") return true;
      return getPropertyStatus(property) === filter;
    });
  }, [properties, filter]);

  const { page, setPage, totalPages, paginatedItems, pageSize, total } =
    usePagination(filtered, filter);

  return (
    <AppPage
      title="Properties"
      subtitle={
        loading
          ? "Loading…"
          : `${properties.length} ${properties.length === 1 ? "property" : "properties"}`
      }
      action={<AddButton onClick={() => router.push("/properties/new")} />}
    >
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              filter === chip.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PropertyListSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface px-4 py-9 text-center text-[13.5px] leading-relaxed text-muted">
          <House
            size={36}
            strokeWidth={1.5}
            className="mx-auto mb-3 text-upcoming"
          />
          {properties.length === 0
            ? "No properties yet — tap + Add to create your first listing."
            : "No properties match this filter."}
        </div>
      ) : (
        <>
          <div className="grid gap-2.5 lg:grid-cols-2 lg:gap-4">
            {paginatedItems.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => setSelected(property)}
              />
            ))}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}

      <PropertyDetailSheet
        property={selected}
        open={!!selected}
        onClose={() => {
          setSelected(null);
          load();
        }}
        onDelete={async (id) => {
          await api.deleteProperty(id);
          load();
        }}
      />
    </AppPage>
  );
}
