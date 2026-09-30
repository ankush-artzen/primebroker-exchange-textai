"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navTabs } from "@/lib/nav-tabs";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { Plus } from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="border-b border-border px-6 py-6">
          <p className="font-serif text-xl text-primary">Prime Brokers</p>
          <p className="mt-0.5 text-xs text-muted">Leads & properties CRM</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navTabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted hover:bg-background hover:text-primary",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={2.5} />
            Quick add
          </button>
        </div>
      </aside>

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
    </>
  );
}
