"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccess } from "@/components/AccessProvider";
import { Spinner } from "@/components/Loader";
import { isStaffRole } from "@/lib/roles";

export function CrmRedirect({ children }: { children: React.ReactNode }) {
  const { role, ready } = useAccess();
  const pathname = usePathname();
  const router = useRouter();
  const creatingLead = pathname.startsWith("/leads/create");
  const creatingProperty = pathname.startsWith("/properties/new");
  const blocked = isStaffRole(role) && (creatingLead || creatingProperty);

  useEffect(() => {
    if (!ready || !blocked) return;
    router.replace(creatingProperty ? "/properties" : "/leads");
  }, [ready, blocked, creatingProperty, router]);

  if (ready && blocked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={32} className="text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
