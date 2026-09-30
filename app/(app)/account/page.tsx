"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, LandPlot, User } from "lucide-react";
import type { User as UserProfile } from "@/lib/types";
import { api } from "@/lib/api";
import { getStoredUserId, setStoredUser } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";
import { AppPage } from "@/components/AppPage";
import { ProfileForm } from "@/components/ProfileForm";
import { UserAvatar } from "@/components/UserAvatar";

const quickLinks = [
  {
    href: "/leads",
    label: "Leads",
    icon: User,
    description: "View and manage leads",
  },
  {
    href: "/properties",
    label: "Properties",
    icon: LandPlot,
    description: "Browse your listings",
  },
];

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getProfile();
      setProfile(data);

      const userId = getStoredUserId();
      if (userId) {
        setStoredUser(userId, {
          name: data.name,
          phone: data.phone,
          profilePictureUrl: data.profilePictureUrl,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleProfileUpdated = (updated: UserProfile) => {
    setProfile(updated);
    setProfileOpen(false);
  };

  return (
    <AppPage title="Account" subtitle="Your profile and settings">
      <div className="md:max-w-2xl">
      <section className="mb-6 overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm">
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-background"
          aria-expanded={profileOpen}
        >
          {loading ? (
            <>
              <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-upcoming" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-upcoming" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-upcoming" />
              </div>
            </>
          ) : error ? (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">Profile</p>
              <p className="text-sm text-overdue-muted">Could not load profile</p>
            </div>
          ) : profile ? (
            <>
              <UserAvatar
                name={profile.name}
                imageUrl={profile.profilePictureUrl}
                size={56}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">{profile.name}</p>
                <p className="truncate text-sm text-muted">{profile.phone}</p>
              </div>
            </>
          ) : null}

          {!loading && (
            <ChevronDown
              size={20}
              className={cn(
                "shrink-0 text-muted transition-transform",
                profileOpen && "rotate-180",
              )}
            />
          )}
        </button>

        {profileOpen && !loading && error && (
          <div className="border-t border-border px-4 py-4 text-center">
            <p className="text-sm text-overdue-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 text-sm font-medium text-primary underline"
            >
              Try again
            </button>
          </div>
        )}

        {profileOpen && !loading && profile && (
          <div className="border-t border-border px-4 pb-4 pt-2">
            <ProfileForm user={profile} onUpdated={handleProfileUpdated} />
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Quick links
        </h2>
        <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-background ${
                  index < quickLinks.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-tint text-ok">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-primary">{link.label}</p>
                  <p className="text-sm text-muted">{link.description}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Session
        </h2>
        <div className="rounded-[14px] border border-border bg-surface p-2 shadow-sm">
          <LogoutButton className="w-full justify-center rounded-lg py-3 text-overdue hover:bg-overdue-tint hover:text-overdue" />
        </div>
      </section>
      </div>
    </AppPage>
  );
}
