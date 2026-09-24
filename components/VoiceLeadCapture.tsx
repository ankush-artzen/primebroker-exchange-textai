"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeadFormData, ParsedLead, SpeechLanguage } from "@/lib/types";
import { api } from "@/lib/api";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { formErrorBanner } from "@/lib/form-errors";
import { LeadForm } from "./LeadForm";
import { ButtonLoader } from "@/components/Loader";
import { Mic, MicOff, Pencil, RotateCcw, X } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";

const languages: { code: SpeechLanguage; label: string }[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिंदी" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
];

const VOICE_HINT_KEY = "prime-brokers-voice-hint-seen";

interface Props {
  onSave: (data: LeadFormData) => Promise<void>;
  onCancel?: () => void;
  variant?: "modal" | "inline";
  open?: boolean;
  onClose?: () => void;
}

function VoiceHintBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#bfe0d2] bg-[#eaf3ef] px-3 py-2.5 text-xs leading-relaxed text-ok">
      <span>
        New: tap the mic and just speak — Hindi, Punjabi or English all work.
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 font-bold text-ok"
      >
        Got it
      </button>
    </div>
  );
}

export function VoiceLeadCapture({
  onSave,
  onCancel,
  variant = "modal",
  open = false,
  onClose,
}: Props) {
  const router = useRouter();
  const isInline = variant === "inline";
  const active = isInline || open;

  const [language, setLanguage] = useState<SpeechLanguage>("hi-IN");
  const [showTypeFallback, setShowTypeFallback] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [formInitial, setFormInitial] = useState<Partial<LeadFormData>>({});
  const [formKey, setFormKey] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const [parseStatus, setParseStatus] = useState("Tap and describe the lead");
  const [editingSpeech, setEditingSpeech] = useState(false);

  const { transcript, listening, supported, start, stop, setTranscript } =
    useSpeechRecognition(language);

  useEffect(() => {
    if (active) {
      setShowVoiceHint(!localStorage.getItem(VOICE_HINT_KEY));
    }
  }, [active]);

  useEffect(() => {
    if (!active) {
      stop();
      setShowTypeFallback(false);
      setTypedText("");
      setFormInitial({});
      setFormKey((k) => k + 1);
      setError("");
      setEditingSpeech(false);
      setTranscript();
      setParseStatus("Tap and describe the lead");
    }
  }, [active, stop, setTranscript]);

  const dismissVoiceHint = () => {
    localStorage.setItem(VOICE_HINT_KEY, "1");
    setShowVoiceHint(false);
  };

  const fillForm = (data: Partial<LeadFormData>) => {
    setFormInitial((prev) => ({ ...prev, ...data }));
    setFormKey((k) => k + 1);
  };

  const handleParse = async () => {
    const text = showTypeFallback ? typedText : transcript;
    if (!text.trim()) {
      setError("Please speak or type something first");
      return;
    }
    setParsing(true);
    setError("");
    stop();
    setParseStatus("Understanding…");
    try {
      const result: ParsedLead = await api.parseLead(text, language);
      fillForm({
        name: result.name ?? "",
        phone: result.phone ?? "",
        requirement: result.requirement ?? "",
        location: result.location ?? "",
        budget: result.budget ?? "",
        notes: result.notes ?? "",
        followUpDate: result.followUpDate ?? "",
      });
      setParseStatus("Filled from what you said — check before saving.");
      dismissVoiceHint();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI parsing failed");
      fillForm({ notes: text });
      setParseStatus("Couldn't parse automatically — notes filled.");
    } finally {
      setParsing(false);
    }
  };

  const turnMicOff = () => {
    setTranscript(transcript);
    stop();
  };

  const turnMicOn = () => {
    setEditingSpeech(false);
    start();
  };

  const resetVoice = () => {
    setEditingSpeech(false);
    setError("");
    setFormInitial({});
    setFormKey((k) => k + 1);
    setParseStatus("Listening… speak again");
    start({ fresh: true });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onClose?.();
  };

  const content = (
    <div className={cn("space-y-4", !isInline && "relative pb-2")}>
      {!isInline && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-0 top-0 rounded-full p-1.5 text-muted"
        >
          <X size={20} />
        </button>
      )}

      {!isInline && (
        <div className="pr-8">
          <h2 className="font-serif text-xl font-medium text-primary">
            Add a lead
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            Under 15 seconds — just speak, in your own language.{" "}
            <button
              type="button"
              onClick={() => {
                onClose?.();
                router.push("/properties/new");
              }}
              className="text-secondary-dark underline"
            >
              Add a property instead
            </button>
          </p>
        </div>
      )}

      {showVoiceHint && (
        <VoiceHintBanner onDismiss={dismissVoiceHint} />
      )}

      {isInline && (
        <p className="text-[12.5px] leading-relaxed text-muted">
          Under 15 seconds — just speak, in your own language.{" "}
          <Link href="/properties/new" className="text-secondary-dark underline">
            Add a property instead
          </Link>
        </p>
      )}

      <div className="rounded-[18px] bg-secondary-tint px-4 py-5 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                language === l.code
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[#e4d3b4] bg-surface text-muted",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {showTypeFallback ? (
          <div className="space-y-3 text-left">
            <textarea
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              rows={3}
              placeholder="e.g. Rahul Sharma, 3BHK Sector 66, budget 80L, call tomorrow 10am"
              className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={parsing || !typedText.trim()}
              onClick={handleParse}
              className="rounded-[10px] bg-secondary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {parsing ? <ButtonLoader label="Processing…" size={14} /> : "Fill from text"}
            </button>
            {supported && (
              <button
                type="button"
                onClick={() => setShowTypeFallback(false)}
                className="block w-full text-xs text-secondary-dark underline"
              >
                Use voice instead
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => (listening ? turnMicOff() : turnMicOn())}
              disabled={!supported}
              className={cn(
                "relative mx-auto flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-colors",
                listening
                  ? "bg-overdue shadow-overdue/35"
                  : "bg-secondary shadow-secondary/35",
              )}
            >
              {listening && (
                <span className="absolute inset-[-9px] animate-ping rounded-full border-2 border-overdue opacity-40" />
              )}
              <Mic size={28} strokeWidth={1.75} />
            </button>
            <p className="mt-3.5 text-[13px] font-medium text-primary">
              {listening
                ? "Listening… mic is on"
                : transcript
                  ? "Mic is off"
                  : parseStatus}
            </p>
            {supported && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => (listening ? turnMicOff() : turnMicOn())}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                    listening
                      ? "border-overdue bg-overdue text-white"
                      : "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  {listening ? "Mic off" : "Mic on"}
                </button>
                <button
                  type="button"
                  onClick={resetVoice}
                  disabled={parsing}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d3b4] bg-surface px-3.5 py-1.5 text-[12.5px] font-semibold text-muted transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
            )}
            {!supported && (
              <p className="mt-1 px-1.5 text-xs italic text-[#8a8578]">
                Voice not supported in this browser
              </p>
            )}
            {supported && (listening || transcript || editingSpeech) && (
              <div className="mt-4 text-left">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted">
                    What you said
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSpeech) {
                        setEditingSpeech(false);
                        return;
                      }
                      stop();
                      setTranscript(transcript);
                      setEditingSpeech(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-dark underline"
                  >
                    <Pencil size={12} />
                    {editingSpeech ? "Done" : "Edit"}
                  </button>
                </div>
                {editingSpeech ? (
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder="Edit the words from your voice note"
                    className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
                  />
                ) : (
                  <p className="min-h-[44px] rounded-[10px] border border-border bg-surface px-3 py-2.5 text-left text-sm leading-relaxed text-primary">
                    {transcript || (
                      <span className="italic text-[#8a8578]">
                        Your words will appear here…
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
            {supported && transcript.trim() && (
              <button
                type="button"
                disabled={parsing}
                onClick={handleParse}
                className="mt-3 rounded-[10px] bg-secondary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {parsing ? <ButtonLoader label="Processing…" size={14} /> : "Fill from speech"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stop();
                setEditingSpeech(false);
                setShowTypeFallback(true);
              }}
              className="mt-3 block w-full text-xs text-secondary-dark underline"
            >
              Type instead
            </button>
          </>
        )}
      </div>

      {error && <p className={formErrorBanner}>{error}</p>}

      <LeadForm
        key={formKey}
        variant="add"
        initial={formInitial}
        onSubmit={async (data) => {
          await onSave(data);
          if (!isInline) onClose?.();
        }}
        onCancel={handleCancel}
        submitLabel="Save lead"
      />
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <Modal open={open} onClose={onClose ?? (() => {})}>
      {content}
    </Modal>
  );
}
