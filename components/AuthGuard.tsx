"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredUserId } from "@/lib/storage";
import { Spinner } from "@/components/Loader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) {
      router.replace("/onboarding");
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size={32} className="text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
