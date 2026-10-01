"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/lib/types";
import { api } from "@/lib/api";
import { useAccess } from "@/components/AccessProvider";
import { isStaffRole } from "@/lib/roles";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailSheet } from "@/components/PropertyDetailSheet";
import { AddButton, AppPage } from "@/components/AppPage";
import { PropertyListSkeleton } from "@/components/Loader";
import { ListPagination } from "@/components/ListPagination";
import { OwnerFilter } from "@/components/OwnerFilter";
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
  const { role } = useAccess();
  const isSuperAdmin = role === "SUPERADMIN";
  const staff = isStaffRole(role);
  const [properties, setProperties] = useState<Property[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
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

  useEffect(() => {
    const timer = window.setTimeout(() => setNameQuery(nameInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [nameInput]);

  const ownersWithProperties = useMemo(() => {
    const byId = new Map<string, string>();
    for (const property of properties) {
      if (!byId.has(property.userId)) {
        byId.set(property.userId, property.ownerName?.trim() || "Unknown user");
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  const filtered = useMemo(() => {
    const needle = nameQuery.toLowerCase();
    const matched = properties.filter((property) => {
      const statusOk = filter === "all" || getPropertyStatus(property) === filter;
      const ownerOk = !ownerId || property.userId === ownerId;
      const nameOk =
        Boolean(ownerId) ||
        !needle ||
        property.title.toLowerCase().includes(needle) ||
        (property.ownerName || "").toLowerCase().includes(needle);
      return statusOk && ownerOk && nameOk;
    });
    if (!isSuperAdmin) return matched;
    return [...matched].sort(
      (a, b) =>
        (a.ownerName || "").localeCompare(b.ownerName || "") ||
        a.title.localeCompare(b.title),
    );
  }, [properties, filter, ownerId, nameQuery, isSuperAdmin]);

  const { page, setPage, totalPages, paginatedItems, pageSize, total } =
    usePagination(filtered, `${filter}:${ownerId}:${nameQuery}`);

  return (
    <AppPage
      title="Properties"
      subtitle={
        loading
          ? "Loading…"
          : isSuperAdmin
            ? "Each user's properties. Edit or delete, without adding new ones."
            : `${properties.length} ${properties.length === 1 ? "property" : "properties"}`
      }
      action={
        staff ? undefined : (
          <AddButton onClick={() => router.push("/properties/new")} />
        )
      }
    >
      {isSuperAdmin && (
        <OwnerFilter
          searchable
          users={ownersWithProperties}
          value={ownerId}
          onChange={setOwnerId}
          query={nameInput}
          onQueryChange={setNameInput}
          placeholder="Search a user who has properties"
        />
      )}
      {!isSuperAdmin && (
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Search name
          </span>
          <input
            value={nameInput}
            placeholder="Search property name"
            onChange={(event) => setNameInput(event.target.value)}
            className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
          />
        </label>
      )}
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
            ? staff
              ? "No properties yet."
              : "No properties yet — tap + Add to create your first listing."
            : nameQuery
              ? "No properties match that name."
              : ownerId
                ? "This user has no properties in this filter."
                : "No properties match this filter."}
        </div>
      ) : (
        <>
          <div className="grid gap-2.5 lg:grid-cols-2 lg:gap-4">
            {paginatedItems.map((property, index) => {
              const previous = paginatedItems[index - 1];
              const showOwner =
                isSuperAdmin &&
                !ownerId &&
                (index === 0 || previous?.userId !== property.userId);

              return (
                <Fragment key={property.id}>
                  {showOwner && (
                    <h2 className="col-span-full pt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      {property.ownerName || "Unknown user"}
                    </h2>
                  )}
                  <PropertyCard
                    property={property}
                    onClick={() => setSelected(property)}
                  />
                </Fragment>
              );
            })}
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
