"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead, LeadFormData } from "@/lib/types";
import { api } from "@/lib/api";
import { LeadForm } from "@/components/LeadForm";
import { AppPage } from "@/components/AppPage";
import { PageLoader } from "@/components/Loader";
import { ArrowLeft } from "lucide-react";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    api
      .getLead(params.id)
      .then(setLead)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load lead"),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async (data: LeadFormData) => {
    if (!params.id) return;
    await api.updateLead(params.id, data);
    router.push("/leads");
  };

  return (
    <AppPage
      header={
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/leads"
            aria-label="Back to leads"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-serif text-[23px] font-medium text-primary">
            Edit Lead
          </h1>
        </header>
      }
    >
      {loading ? (
        <PageLoader label="Loading lead…" />
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : lead ? (
        <LeadForm
          initial={lead}
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          onCancel={() => router.push("/leads")}
        />
      ) : null}
    </AppPage>
  );
}
