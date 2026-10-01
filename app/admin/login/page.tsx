"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ButtonLoader } from "@/components/Loader";
import { formErrorBanner } from "@/lib/form-errors";
import { homePath, isStaffRole } from "@/lib/roles";
import {
  getStoredRole,
  getStoredSessionToken,
  setStoredUser,
} from "@/lib/storage";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isStaffRole(getStoredRole()) && getStoredSessionToken()) {
      router.replace(homePath(getStoredRole()));
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      const user = await api.adminLogin(username.trim(), password);
      if (!user.sessionToken) {
        setError("Could not start your session. Try again.");
        return;
      }

      setStoredUser(user.id, {
        name: user.name,
        phone: user.phone,
        profilePictureUrl: user.profilePictureUrl,
        role: user.role,
        username: user.username,
        canAddUsers: user.canAddUsers,
        userLimit: user.userLimit,
        sessionToken: user.sessionToken,
      });
      router.replace(homePath(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl md:block"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-[24px] border border-border bg-surface p-6 shadow-lg shadow-black/5 md:p-7"
      >
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="Prime Brokers"
            width={48}
            height={48}
            className="rounded-xl"
            priority
          />
          <div>
            <h1 className="font-serif text-2xl leading-tight text-primary">
              Admin sign in
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Username and password for the admin account
            </p>
          </div>
        </div>

        {error && <p className={`mb-4 ${formErrorBanner}`}>{error}</p>}

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Username
        </label>
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (error) setError("");
          }}
          className="mb-4 w-full rounded-2xl border border-border bg-background px-3.5 py-3.5 text-[15px] text-primary outline-none focus:border-primary"
        />

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError("");
          }}
          className="w-full rounded-2xl border border-border bg-background px-3.5 py-3.5 text-[15px] text-primary outline-none focus:border-primary"
        />

        <button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-45"
        >
          {loading ? <ButtonLoader label="Signing in" size={18} /> : "Sign in"}
        </button>

        <p className="mt-4 text-center text-[12px] text-muted">
          <Link href="/onboarding" className="font-semibold text-primary">
            Broker sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
