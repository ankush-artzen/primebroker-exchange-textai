"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homePath } from "@/lib/roles";
import { getStoredRole, getStoredSessionToken } from "@/lib/storage";
import { Spinner } from "@/components/Loader";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const sessionToken = getStoredSessionToken();
    router.replace(sessionToken ? homePath(getStoredRole()) : "/onboarding");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner size={32} className="text-primary" />
    </div>
  );
}
