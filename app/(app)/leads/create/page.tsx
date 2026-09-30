"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LeadFormData } from "@/lib/types";
import { api } from "@/lib/api";
import { VoiceLeadCapture } from "@/components/VoiceLeadCapture";
import { AppPage } from "@/components/AppPage";
import { ArrowLeft } from "lucide-react";

export default function CreateLeadPage() {
  const router = useRouter();

  const handleCreate = async (data: LeadFormData) => {
    await api.createLead(data);
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
            Add Lead
          </h1>
        </header>
      }
    >
      <VoiceLeadCapture
        variant="inline"
        onSave={handleCreate}
        onCancel={() => router.push("/leads")}
      />
    </AppPage>
  );
}
