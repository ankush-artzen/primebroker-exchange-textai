"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { isStaffRole } from "@/lib/roles";
import { clearStoredUser, getStoredRole } from "@/lib/storage";

interface Props {
  className?: string;
}

export function LogoutButton({ className }: Props) {
  const router = useRouter();

  const handleLogout = () => {
    const staff = isStaffRole(getStoredRole());
    clearStoredUser();
    router.replace(staff ? "/admin/login" : "/onboarding");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Log out"
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
        className,
      )}
    >
      <LogOut size={18} strokeWidth={2} />
      Log out
    </button>
  );
}
