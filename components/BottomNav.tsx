"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getNavTabs } from "@/lib/nav-tabs";
import { useAccess } from "@/components/AccessProvider";
import { isStaffRole } from "@/lib/roles";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { Plus } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { canManageUsers, role } = useAccess();
  const addingRecord =
    pathname.startsWith("/leads/create") || pathname.startsWith("/properties/new");
  const canCreate = !isStaffRole(role) && !addingRecord;
  const navTabs = getNavTabs(canManageUsers);
  const compact = navTabs.length > 4;
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const renderTab = (tab: (typeof navTabs)[number]) => {
    const active = pathname.startsWith(tab.href);
    const Icon = tab.icon;

    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2.5 font-medium transition-colors",
          compact ? "text-[10px]" : "text-xs",
          active ? "text-primary" : "text-zinc-400",
        )}
      >
        <Icon size={compact ? 18 : 20} strokeWidth={active ? 2.25 : 2} />
        {tab.label}
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="relative mx-auto flex max-w-lg items-end">
          {canCreate ? (
            <>
              {navTabs.slice(0, 2).map(renderTab)}
              <div className="flex w-16 shrink-0 justify-center">
                <button
                  type="button"
                  aria-label="Quick add"
                  onClick={() => setQuickAddOpen(true)}
                  className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
                >
                  <Plus size={26} strokeWidth={2.5} />
                </button>
              </div>
              {navTabs.slice(2).map(renderTab)}
            </>
          ) : (
            navTabs.map(renderTab)
          )}
        </div>
      </nav>

      {canCreate && (
        <QuickAddSheet
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onAddLead={() => {
            router.push("/leads/create");
          }}
          onAddProperty={() => {
            router.push("/properties/new");
          }}
        />
      )}
    </>
  );
}
