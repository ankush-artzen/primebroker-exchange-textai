"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadFormData } from "@/lib/types";
import {
  cn,
  formatDateTime,
  formatFollowUpDateTime,
  getInitials,
  getLeadStatus,
  getLeadUrgency,
  normalizeIndianPhone,
  type LeadStatus,
} from "@/lib/utils";
import { CallWhatsAppButtons } from "./CallWhatsAppButtons";
import { RescheduleButtons } from "./RescheduleButtons";
import { ConfirmDialog } from "./ConfirmDialog";
import { ButtonLoader } from "./Loader";
import { Modal } from "./Modal";
import {
  CalendarClock,
  Check,
  Clock,
  MapPin,
  NotebookPen,
  Pencil,
  Phone,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    data: Partial<LeadFormData> & { followUpDone?: boolean },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const statusStyles: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-upcoming text-foreground/70" },
  interested: { label: "Interested", className: "bg-ok-tint text-ok" },
  negotiation: { label: "Negotiation", className: "bg-today-tint text-today" },
};

const urgencyBanner = {
  overdue: {
    label: "Overdue",
    className: "border-overdue-muted/25 bg-overdue-tint",
    text: "text-overdue-muted",
  },
  due: {
    label: "Due today",
    className: "border-today/25 bg-today-tint",
    text: "text-today",
  },
  upcoming: {
    label: "Upcoming",
    className: "border-border bg-background",
    text: "text-muted",
  },
  none: {
    label: "No follow-up",
    className: "border-border bg-background",
    text: "text-muted",
  },
} as const;

export function LeadDetailSheet({
  lead,
  open,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"done" | "reschedule" | "delete" | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!lead) return null;

  const loading = pending !== null;
  const whatsappMsg = `Hi ${lead.name}, this is regarding your property requirement${lead.requirement ? ` for ${lead.requirement}` : ""}.`;
  const status = getLeadStatus(lead);
  const tag = statusStyles[status];
  const urgency = getLeadUrgency(lead);
  const banner = urgencyBanner[urgency];
  const followUp = formatFollowUpDateTime(lead.followUpDate);

  const handleMarkDone = async () => {
    setPending("done");
    try {
      await onUpdate(lead.id, { followUpDone: true });
      onClose();
    } finally {
      setPending(null);
    }
  };

  const handleReschedule = async (date: Date) => {
    setPending("reschedule");
    try {
      await onUpdate(lead.id, {
        followUpDate: date.toISOString(),
        followUpDone: false,
      });
      onClose();
    } finally {
      setPending(null);
    }
  };

  const handleDelete = async () => {
    setPending("delete");
    try {
      await onDelete(lead.id);
      setConfirmOpen(false);
      onClose();
    } finally {
      setPending(null);
    }
  };

  const handleEdit = () => {
    onClose();
    router.push(`/leads/${lead.id}/edit`);
  };

  return (
    <>
    <Modal
      open={open}
      onClose={() => {
        setConfirmOpen(false);
        onClose();
      }}
      title={lead.name}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-tint text-sm font-semibold text-secondary-dark">
            {getInitials(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  tag.className,
                )}
              >
                {tag.label}
              </span>
              {lead.followUpDone && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ok-tint px-2.5 py-0.5 text-[10px] font-semibold text-ok">
                  <Check size={11} strokeWidth={2.5} />
                  Follow-up done
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Phone size={14} className="shrink-0" />
              {normalizeIndianPhone(lead.phone)}
            </p>
            {/* <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
              <Clock size={13} className="shrink-0" />
              Created {formatDateTime(lead.createdAt)}
            </p> */}
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border px-3.5 py-3",
            lead.followUpDone
              ? "border-ok/25 bg-ok-tint/50"
              : banner.className,
          )}
        >
          <div className="flex items-start gap-2.5">
            <CalendarClock
              size={18}
              className={cn(
                "mt-0.5 shrink-0",
                lead.followUpDone ? "text-ok" : banner.text,
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Follow-up
              </p>
              {lead.followUpDone ? (
                <p className="mt-0.5 text-sm font-medium text-ok">
                  Completed
                </p>
              ) : lead.followUpDate ? (
                <>
                  <p
                    className={cn(
                      "mt-0.5 text-sm font-semibold",
                      banner.text,
                    )}
                  >
                    {banner.label !== "No follow-up" && (
                      <span className="mr-1.5">{banner.label} ·</span>
                    )}
                    {followUp.date}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium text-primary">
                    {new Date(lead.followUpDate).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-sm text-muted">Not scheduled</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <DetailTile
            icon={Tag}
            label="Requirement"
            value={lead.requirement}
          />
          <DetailTile icon={Wallet} label="Budget" value={lead.budget} />
          <DetailTile
            icon={MapPin}
            label="Location"
            value={lead.location}
            className="col-span-2"
          />
          {lead.source && (
            <DetailTile
              icon={Tag}
              label="Source"
              value={lead.source}
              className="col-span-2"
            />
          )}
        </div>

        {lead.notes && (
          <div className="rounded-xl border border-border/80 bg-background px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <NotebookPen size={12} />
              Notes
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-primary">
              {lead.notes}
            </p>
          </div>
        )}

        <CallWhatsAppButtons phone={lead.phone} whatsappMessage={whatsappMsg} />

        {!lead.followUpDone && (
          <div className="space-y-2.5 rounded-xl border border-border/80 bg-background p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Reschedule
            </p>
            <RescheduleButtons
              onReschedule={handleReschedule}
              loading={pending === "reschedule"}
              disabled={loading}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border/80 pt-4">
          {!lead.followUpDone && (
            <button
              type="button"
              disabled={loading}
              onClick={handleMarkDone}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {pending === "done" ? (
                <ButtonLoader label="Updating…" />
              ) : (
                <>
                  <Check size={18} />
                  Mark follow-up done
                </>
              )}
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-primary"
            >
              <Pencil size={18} />
              Edit
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 disabled:opacity-50"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </Modal>
    <ConfirmDialog
      open={confirmOpen}
      title="Delete this lead?"
      description="This can’t be undone. The lead and its follow-up history will be removed."
      loading={pending === "delete"}
      onCancel={() => setConfirmOpen(false)}
      onConfirm={handleDelete}
    />
    </>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string | null;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-surface px-3 py-2.5",
        className,
      )}
    >
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <Icon size={11} className="shrink-0" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-snug text-primary">
        {value}
      </p>
    </div>
  );
}
