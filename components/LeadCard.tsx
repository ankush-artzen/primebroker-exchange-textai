"use client";

import type { Lead } from "@/lib/types";
import {
  cn,
  formatDate,
  getInitials,
  getLeadStatus,
  getLeadUrgency,
  normalizeIndianPhone,
  type LeadStatus,
} from "@/lib/utils";
import { CallWhatsAppButtons } from "./CallWhatsAppButtons";
import { TruncatedText } from "./TruncatedText";
import { CalendarClock, Wallet } from "lucide-react";

interface Props {
  lead: Lead;
  onClick: () => void;
}

const statusStyles: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-upcoming text-foreground/70" },
  interested: { label: "Interested", className: "bg-ok-tint text-ok" },
  negotiation: { label: "Negotiation", className: "bg-today-tint text-today" },
};

const urgencyStyles = {
  overdue: {
    stripe: "bg-overdue-muted",
    label: "Overdue",
    className: "text-overdue-muted",
  },
  due: {
    stripe: "bg-today",
    label: "Due today",
    className: "text-today",
  },
  upcoming: {
    stripe: "bg-border",
    label: null as string | null,
    className: "text-muted",
  },
  none: {
    stripe: "bg-border",
    label: null as string | null,
    className: "text-muted",
  },
} as const;

export function LeadCard({ lead, onClick }: Props) {
  const urgency = getLeadUrgency(lead);
  const status = getLeadStatus(lead);
  const tag = statusStyles[status];
  const urgencyStyle = urgencyStyles[urgency];
  const whatsappMsg = `Hi ${lead.name}, following up on your property requirement.`;
  const meta = [lead.requirement, lead.location].filter(Boolean).join(" • ");
  const followUpLabel =
    urgencyStyle.label ??
    (lead.followUpDate && !lead.followUpDone
      ? formatDate(lead.followUpDate)
      : null);

  return (
    <article className="overflow-hidden rounded-[14px] border border-border/70 bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="flex min-h-0">
        <div
          className={cn("w-1 shrink-0", urgencyStyle.stripe)}
          aria-hidden
        />

        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <button
            type="button"
            onClick={onClick}
            className="flex w-full gap-3 text-left active:opacity-90"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-tint text-[13px] font-semibold text-secondary-dark"
              aria-hidden
            >
              {getInitials(lead.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <TruncatedText
                  as="span"
                  wrapperClassName="flex-1"
                  className="text-[15px] font-semibold leading-snug text-primary"
                >
                  {lead.name}
                </TruncatedText>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    tag.className,
                  )}
                >
                  {tag.label}
                </span>
              </div>

              {followUpLabel && (
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-[11px] font-medium",
                    urgencyStyle.className,
                  )}
                >
                  <CalendarClock size={11} strokeWidth={2.25} />
                  {followUpLabel}
                </p>
              )}

              {meta && (
                <TruncatedText className="mt-1.5 text-[12.5px] leading-snug text-muted">
                  {meta}
                </TruncatedText>
              )}

              {lead.budget && (
                <p className="mt-2 inline-flex max-w-full items-center gap-1 text-[12px] font-medium text-primary">
                  <Wallet size={12} className="shrink-0 text-muted" />
                  <span className="truncate">{lead.budget}</span>
                </p>
              )}
            </div>
          </button>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/80 pt-3">
            <p className="min-w-0 truncate text-[12px] font-medium tabular-nums text-muted">
              {normalizeIndianPhone(lead.phone)}
            </p>
            <CallWhatsAppButtons
              phone={lead.phone}
              whatsappMessage={whatsappMsg}
              iconOnly
              size="sm"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
