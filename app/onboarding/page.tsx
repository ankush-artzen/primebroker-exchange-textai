"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  LandPlot,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { ButtonLoader } from "@/components/Loader";
import { fieldErrorText, formErrorBanner } from "@/lib/form-errors";
import { setStoredUser } from "@/lib/storage";
import type { User } from "@/lib/types";
import {
  cn,
  formatPhone,
  isValidIndianPhone,
  isValidPersonName,
  sanitizePersonName,
} from "@/lib/utils";

const features = [
  {
    icon: Users,
    label: "Track leads",
    short: "Leads",
    description: "Capture buyer inquiries in seconds",
  },
  {
    icon: LandPlot,
    label: "List properties",
    short: "Properties",
    description: "Keep all your listings in one place",
  },
  {
    icon: Bell,
    label: "Daily follow-ups",
    short: "Follow-ups",
    description: "Never miss a callback again",
  },
];

const steps = ["phone", "otp", "name"] as const;
type Step = (typeof steps)[number];

const stepCopy = {
  phone: {
    title: "Welcome, Broker",
    subtitle: "Sign in with a one-time code sent to your phone.",
    button: "Send OTP",
    loading: "Sending code…",
    progress: "Phone",
  },
  otp: {
    title: "Enter OTP",
    subtitle: "Check SMS for the 6-digit code.",
    button: "Verify OTP",
    loading: "Verifying…",
    progress: "OTP",
  },
  name: {
    title: "Almost there",
    subtitle: "Phone verified. Tell us your name to finish setup.",
    button: "Get Started",
    loading: "Setting up…",
    progress: "Name",
  },
} as const;

function groupedPhone(phone: string) {
  const digits = formatPhone(phone).slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const verifyingRef = useRef(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const stepIndex = steps.indexOf(step);
  const copy = stepCopy[step];
  const canSubmit =
    (step === "phone" && isValidIndianPhone(phone)) ||
    (step === "otp" && /^\d{6}$/.test(otp)) ||
    (step === "name" && isValidPersonName(name));

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step === "phone") phoneRef.current?.focus();
      if (step === "otp") otpRef.current?.focus();
      if (step === "name") nameRef.current?.focus();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [step]);

  const completeLogin = (user: User) => {
    setStoredUser(user.id, {
      name: user.name,
      phone: user.phone,
      profilePictureUrl: user.profilePictureUrl,
    });
    router.replace("/today");
  };

  const updateName = (value: string) => {
    setName(sanitizePersonName(value));
    if (error) setError("");
  };

  const updatePhone = (value: string) => {
    setPhone(formatPhone(value).slice(0, 10));
    setPhoneError("");
    if (error) setError("");
  };

  const sendCode = async () => {
    setError("");
    setPhoneError("");
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      await api.sendOtp(phone.trim());
      setOtp("");
      setStep("otp");
      setResendIn(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code = otp) => {
    if (verifyingRef.current) return;
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code sent to your phone");
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    try {
      const result = await api.verifyOtp(phone.trim(), code);
      setVerificationToken(result.token);
      if (result.user) {
        completeLogin(result.user);
        return;
      }
      setStep("name");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OTP");
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  };

  const createAccount = async () => {
    setError("");
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!isValidPersonName(name)) {
      setError("Name can only contain letters");
      return;
    }

    setLoading(true);
    try {
      const user = await api.identify(name.trim(), phone.trim(), verificationToken);
      completeLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "phone") await sendCode();
    else if (step === "otp") await verifyCode();
    else await createAccount();
  };

  const goBack = () => {
    setError("");
    if (step === "name") {
      setStep("otp");
      return;
    }
    setStep("phone");
    setOtp("");
    setVerificationToken("");
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 hidden h-56 w-56 rounded-full bg-secondary-tint blur-3xl md:block"
      />

      <header className="relative overflow-hidden bg-primary px-5 pb-5 pt-[max(0.85rem,env(safe-area-inset-top))] md:hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-black/10 blur-2xl"
        />
        <div className="relative flex items-center gap-3">
          <div className="rounded-[16px] bg-white/15 p-1 ring-1 ring-white/25">
            <Image
              src="/icons/icon-192.png"
              alt="Prime Brokers"
              width={48}
              height={48}
              className="rounded-[13px]"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-[1.45rem] leading-tight text-primary-foreground">
              Prime Brokers
            </h1>
            <p className="mt-0.5 text-[12px] text-primary-foreground/80">
              Leads, properties & follow-ups
            </p>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col md:min-h-dvh md:flex-row md:items-center md:justify-center md:gap-12 md:px-10 md:py-12 lg:gap-20">
        <section className="hidden md:block md:flex-1">
          <div className="mb-8 flex items-center gap-4">
            <div className="relative shrink-0 rounded-2xl bg-surface p-1.5 shadow-lg shadow-primary/15 ring-1 ring-border">
              <Image
                src="/icons/icon-192.png"
                alt="Prime Brokers"
                width={72}
                height={72}
                className="rounded-xl"
                priority
              />
            </div>
            <div>
              <h1 className="font-serif text-3xl leading-tight text-primary">
                Prime Brokers
              </h1>
              <p className="mt-1 text-sm text-muted">
                Leads, properties & follow-ups — fast.
              </p>
            </div>
          </div>

          <p className="mb-6 max-w-sm text-base leading-relaxed text-foreground/80">
            Your pocket CRM built for real-estate brokers. Sign in with a
            one-time code — no password needed.
          </p>

          <ul className="space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.label}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/70 px-4 py-3.5 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-tint text-secondary">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {feature.label}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex w-full flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:mt-0 md:max-w-sm md:flex-none md:shrink-0 md:px-0 md:pb-0 md:pt-0 lg:max-w-md">
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-border bg-surface p-5 shadow-lg shadow-black/5 md:min-h-0 md:flex-none md:rounded-3xl md:p-7 md:shadow-primary/5"
          >
            <StepProgress current={stepIndex} />

            <div className="mb-5 flex items-start gap-3">
              {step !== "phone" && (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Go back"
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-primary ring-1 ring-border"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-[1.45rem] leading-tight text-primary md:text-xl">
                  {copy.title}
                </h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted md:text-sm">
                  {step === "otp" ? (
                    <>
                      Sent to{" "}
                      <span className="font-semibold text-foreground">
                        +91 {groupedPhone(phone)}
                      </span>
                    </>
                  ) : (
                    copy.subtitle
                  )}
                </p>
              </div>
            </div>

            {error && <p className={`mb-4 ${formErrorBanner}`}>{error}</p>}

            <div className="min-h-[7.5rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {step === "phone" && (
                    <PhoneField
                      ref={phoneRef}
                      value={phone}
                      onChange={updatePhone}
                      error={phoneError}
                    />
                  )}

                  {step === "otp" && (
                    <OtpField
                      ref={otpRef}
                      value={otp}
                      disabled={loading}
                      onChange={(value) => {
                        const next = value.replace(/\D/g, "").slice(0, 6);
                        setOtp(next);
                        if (error) setError("");
                        if (next.length === 6) void verifyCode(next);
                      }}
                    />
                  )}

                  {step === "name" && (
                    <NameField
                      ref={nameRef}
                      value={name}
                      onChange={updateName}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step === "phone" && (
              <ul className="mt-5 grid grid-cols-3 gap-2 md:hidden">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li
                      key={feature.label}
                      className="flex flex-col items-center gap-1.5 rounded-2xl bg-background px-2 py-3 text-center"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-tint text-secondary">
                        <Icon size={15} strokeWidth={2.25} />
                      </span>
                      <span className="text-[11px] font-semibold leading-tight text-primary">
                        {feature.short}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-auto pt-6 md:mt-6 md:pt-0">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-[0.98] disabled:opacity-45 md:rounded-xl md:py-3.5 md:text-sm"
              >
                {loading ? (
                  <ButtonLoader label={copy.loading} size={18} />
                ) : (
                  <>
                    {copy.button}
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </>
                )}
              </button>

              {step === "otp" && (
                <button
                  type="button"
                  disabled={loading || resendIn > 0}
                  onClick={() => void sendCode()}
                  className="mt-3 w-full py-1 text-center text-[13px] font-semibold text-primary disabled:text-muted"
                >
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend OTP"}
                </button>
              )}

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted md:text-xs">
                <ShieldCheck size={14} className="shrink-0 text-ok" />
                OTP login · No password needed
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-5 md:mb-6">
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wide">
        <span className="text-primary">
          Step {current + 1} of {steps.length}
        </span>
        <span className="text-muted">{stepCopy[steps[current]].progress}</span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((id, index) => (
          <span
            key={id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index <= current ? "bg-primary" : "bg-upcoming",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PhoneField({
  value,
  onChange,
  error,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  ref: Ref<HTMLInputElement>;
}) {
  const complete = value.length === 10;

  return (
    <div data-field-error={error ? "true" : undefined}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        Mobile number
      </label>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-2xl border bg-background transition-colors focus-within:bg-surface",
          error
            ? "border-red-500"
            : complete
              ? "border-ok/50"
              : "border-border focus-within:border-primary",
        )}
      >
        <span className="flex h-full items-center self-stretch bg-secondary-tint px-3.5 text-sm font-semibold text-secondary">
          +91
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          name="tel"
          value={value}
          maxLength={10}
          placeholder="98765 43210"
          autoComplete="tel"
          enterKeyHint="send"
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-[17px] tracking-wide text-primary outline-none placeholder:text-muted/55"
        />
        {complete && (
          <span className="pr-3 text-ok">
            <Check size={18} strokeWidth={2.5} />
          </span>
        )}
      </div>
      {error ? (
        <p className={fieldErrorText}>{error}</p>
      ) : (
        <p className="mt-1.5 text-[11px] text-muted">
          {value.length === 0
            ? "We’ll send a 6-digit OTP to this number"
            : complete
              ? "Looks good — tap Send OTP"
              : `${10 - value.length} more digit${10 - value.length === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  );
}

function OtpField({
  value,
  onChange,
  disabled,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ref: Ref<HTMLInputElement>;
}) {
  const activeIndex = Math.min(value.length, 5);

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
        6-digit code
      </label>
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          name="one-time-code"
          value={value}
          maxLength={6}
          disabled={disabled}
          enterKeyHint="done"
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          aria-label="6-digit OTP"
        />
        <div className="pointer-events-none grid grid-cols-6 gap-1.5 sm:gap-2">
          {Array.from({ length: 6 }, (_, index) => {
            const filled = Boolean(value[index]);
            const active = !disabled && index === activeIndex;
            return (
              <div
                key={index}
                className={cn(
                  "flex h-[3.35rem] items-center justify-center rounded-2xl border bg-background text-[1.35rem] font-semibold text-primary",
                  filled && "border-primary/70 bg-surface",
                  active && "border-primary ring-2 ring-primary/20",
                  !filled && !active && "border-border",
                )}
              >
                {value[index] ?? ""}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NameField({
  value,
  onChange,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  ref: Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        Your name
      </label>
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder="Rajesh Kumar"
        autoComplete="name"
        enterKeyHint="go"
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-[17px] text-primary outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:bg-surface"
      />
    </div>
  );
}
