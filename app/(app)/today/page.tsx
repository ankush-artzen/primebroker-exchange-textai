"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/types";
import { api } from "@/lib/api";
import { getStoredUserProfile, type StoredUserProfile } from "@/lib/storage";
import {
  cn,
  formatLongDate,
  getGreeting,
  isTodayFollowUpTimePassed,
  shouldShowOnTodayPage,
} from "@/lib/utils";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailSheet } from "@/components/LeadDetailSheet";
import { AppPage } from "@/components/AppPage";
import { ListSkeleton, StatSkeleton } from "@/components/Loader";
import { UserAvatar } from "@/components/UserAvatar";
import { AlertCircle, CircleCheck } from "lucide-react";

export default function TodayPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [now, setNow] = useState(() => new Date());
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const userName = userProfile?.name;
  const firstName = userName?.split(" ")[0] ?? "Broker";

  useEffect(() => {
    setUserProfile(getStoredUserProfile());
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsData, propertiesData] = await Promise.all([
        api.getTodayLeads(),
        api.getProperties(),
      ]);
      setLeads(leadsData);
      setPropertiesCount(propertiesData.length);
    } catch {
      setError("Failed to load data. Please try again.");
      setLeads([]);
      setPropertiesCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { dueTodayCount, missedTodayCount, visibleLeads } = useMemo(() => {
    const visible = leads.filter((lead) => shouldShowOnTodayPage(lead, now));
    const missed = leads.filter((lead) =>
      isTodayFollowUpTimePassed(lead, now),
    );

    return {
      dueTodayCount: visible.length,
      missedTodayCount: missed.length,
      visibleLeads: visible,
    };
  }, [leads, now]);

  return (
    <AppPage
      header={
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[1.75rem] leading-tight text-primary">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-1 text-[12.5px] text-muted">{formatLongDate()}</p>
          </div>
          <Link
            href="/account"
            aria-label="Go to account"
            className="active:opacity-90"
          >
            <UserAvatar
              name={userName}
              imageUrl={userProfile?.profilePictureUrl}
              size={44}
            />
          </Link>
        </header>
      }
    >
      <div className="mb-8 rounded-3xl bg-primary px-4 py-5 shadow-lg shadow-primary/20">
        <div className="grid grid-cols-3 divide-x divide-white/15">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <Stat value={dueTodayCount} label="Due today" />
              <Stat value={missedTodayCount} label="Time passed" highlight />
              <Stat value={propertiesCount} label="Properties saved" />
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={load}
            className="text-sm font-medium text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <h2 className="mb-4 font-serif text-xl text-primary">
          Today&apos;s follow-ups
        </h2>

        {loading ? (
          <ListSkeleton count={3} className="gap-3 lg:gap-4" />
        ) : visibleLeads.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
            <CircleCheck
              size={40}
              strokeWidth={1.5}
              className="mx-auto text-secondary"
            />
            <p className="mt-3 font-medium text-primary">All caught up!</p>
            <p className="text-sm text-muted">
              No follow-ups left for today right now.
            </p>
            <Link
              href="/leads/create"
              className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Add a lead
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {visibleLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => setSelected(lead)}
              />
            ))}
          </div>
        )}
      </section>

      <LeadDetailSheet
        lead={selected}
        open={!!selected}
        onClose={() => {
          setSelected(null);
          load();
        }}
        onUpdate={async (id, data) => {
          await api.updateLead(id, data);
          load();
        }}
        onDelete={async (id) => {
          await api.deleteLead(id);
          load();
        }}
      />
    </AppPage>
  );
}

function Stat({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-2 text-center">
      <p
        className={cn(
          "font-serif text-3xl leading-none",
          highlight ? "text-overdue-muted" : "text-primary-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-tight text-white/55">{label}</p>
    </div>
  );
}
