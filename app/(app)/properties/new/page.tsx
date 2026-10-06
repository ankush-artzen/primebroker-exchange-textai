"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { PropertyFormData } from "@/lib/types";
import { api } from "@/lib/api";
import { PropertyForm } from "@/components/PropertyForm";
import { AppPage } from "@/components/AppPage";
import { ArrowLeft } from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  const wizardBackRef = useRef<(() => boolean) | null>(null);

  const handleBack = () => {
    if (wizardBackRef.current?.()) return;
    router.push("/properties");
  };

  const handleCreate = async (data: PropertyFormData) => {
    await api.createProperty(data);
    router.push("/properties");
  };

  return (
    <AppPage
      header={
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif text-[23px] font-medium text-primary">
            Add Property
          </h1>
        </header>
      }
    >
      <PropertyForm
        wizardBackRef={wizardBackRef}
        onSubmit={handleCreate}
        onCancel={() => router.push("/properties")}
      />
    </AppPage>
  );
}
