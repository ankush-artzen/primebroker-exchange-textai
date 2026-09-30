"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Property, PropertyFormData } from "@/lib/types";
import { api } from "@/lib/api";
import { PropertyForm } from "@/components/PropertyForm";
import { AppPage } from "@/components/AppPage";
import { PageLoader } from "@/components/Loader";
import { ArrowLeft } from "lucide-react";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    api
      .getProperty(params.id)
      .then(setProperty)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load property"),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async (data: PropertyFormData) => {
    if (!params.id) return;
    await api.updateProperty(params.id, data);
    router.push("/properties");
  };

  return (
    <AppPage
      header={
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/properties"
            aria-label="Back to properties"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-serif text-[23px] font-medium text-primary">
            Edit Property
          </h1>
        </header>
      }
    >
      {loading ? (
        <PageLoader label="Loading property…" />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : property ? (
        <PropertyForm
          initial={property}
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          onCancel={() => router.push("/properties")}
        />
      ) : null}
    </AppPage>
  );
}
