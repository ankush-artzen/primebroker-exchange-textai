"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUserId } from "@/lib/storage";
import { Spinner } from "@/components/Loader";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const userId = getStoredUserId();
    router.replace(userId ? "/today" : "/onboarding");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner size={32} className="text-primary" />
    </div>
  );
}
