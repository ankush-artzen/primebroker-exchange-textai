export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function normalizeIndianPhone(phone: string): string {
  const digits = formatPhone(phone);
  if (!digits) return "";
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function isValidIndianPhone(phone: string): boolean {
  return normalizeIndianPhone(phone).length === 10;
}

/** E.164 for Indian mobiles — Twilio Verify does not need a purchased number. */
export function toE164India(phone: string): string {
  return `+91${normalizeIndianPhone(phone)}`;
}

export function sanitizePersonName(name: string): string {
  return name.replace(/[^\p{L}\s]/gu, "");
}

export function isValidPersonName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  return /^[\p{L}\s]+$/u.test(trimmed);
}

export function phoneDialLink(phone: string): string {
  const digits = formatPhone(phone);
  return digits ? `tel:+${digits.startsWith("91") ? digits : `91${digits}`}` : "#";
}

export function whatsappLink(phone: string, message?: string): string {
  const digits = formatPhone(phone);
  const num = digits.startsWith("91") ? digits : `91${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${num}${text}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "B";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";

  const datePart = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

export function formatFollowUpDateTime(
  date: string | Date | null | undefined,
): { date: string; time: string | null } {
  if (!date) return { date: "Not set", time: null };

  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return { date: "—", time: null };

  const datePart = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const hasTime = followUpHasTime(d);
  const timePart = hasTime
    ? d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return { date: datePart, time: timePart };
}

export function formatCurrency(value: string | null | undefined): string {
  if (!value) return "—";
  return value;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseFollowUpDate(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [, y, m, d] = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
    return new Date(+y, +m - 1, +d);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseFollowUpMoment(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return parseFollowUpDate(trimmed);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function followUpHasTime(date: Date): boolean {
  return date.getHours() !== 0 || date.getMinutes() !== 0;
}

export function toLocalDateKey(
  date: string | Date | null | undefined,
): string {
  const d =
    typeof date === "string" ? parseFollowUpMoment(date) : date ?? null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return formatDateKey(d);
}

export function toDatetimeLocalValue(
  value: string | Date | null | undefined,
): string {
  const d = parseFollowUpMoment(value);
  if (!d || Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function normalizeFollowUpInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const today = startOfToday();
  if (/\btoday\b/.test(lower)) return today.toISOString();
  if (/\btomorrow\b/.test(lower)) return addDays(today, 1).toISOString();

  const parsed = parseFollowUpMoment(trimmed);
  return parsed ? parsed.toISOString() : null;
}

export function isOverdue(followUpDate: string | null | undefined): boolean {
  const d = parseFollowUpMoment(followUpDate);
  if (!d) return false;

  const now = new Date();

  if (followUpHasTime(d)) {
    return now.getTime() > d.getTime();
  }

  const key = formatDateKey(d);
  return key < formatDateKey(now);
}

export function isToday(date: string | null | undefined): boolean {
  const d = parseFollowUpMoment(date);
  if (!d) return false;
  return formatDateKey(d) === formatDateKey(new Date());
}

export function isDueForFollowUp(lead: {
  followUpDate?: string | null;
  followUpDone: boolean;
}): boolean {
  if (!lead.followUpDate || lead.followUpDone) return false;
  const urgency = getLeadUrgency(lead);
  return urgency === "overdue" || urgency === "due";
}

export type LeadStatus = "new" | "interested" | "negotiation";

export type LeadFilter = "all" | "due-today" | "new" | "negotiation";

const leadStatuses: LeadStatus[] = ["new", "interested", "negotiation"];

export function normalizeLeadStatus(value?: string | null): LeadStatus | null {
  const normalized = value?.toLowerCase().trim();
  if (normalized && leadStatuses.includes(normalized as LeadStatus)) {
    return normalized as LeadStatus;
  }
  return null;
}

export function getLeadStatus(lead: {
  status?: string | null;
  createdAt: string;
  notes?: string | null;
  requirement?: string | null;
}): LeadStatus {
  const stored = normalizeLeadStatus(lead.status);
  if (stored) return stored;

  const text = `${lead.notes ?? ""} ${lead.requirement ?? ""}`;
  if (/negotiat/i.test(text)) return "negotiation";

  const created = new Date(lead.createdAt).getTime();
  const weekAgo = Date.now() - 7 * 86400000;
  if (created > weekAgo) return "new";

  return "interested";
}

export function matchesLeadFilter(
  lead: {
    status?: string | null;
    createdAt: string;
    notes?: string | null;
    requirement?: string | null;
    followUpDate?: string | null;
    followUpDone: boolean;
  },
  filter: LeadFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "due-today":
      return isDueForFollowUp(lead);
    case "new":
      return getLeadStatus(lead) === "new";
    case "negotiation":
      return getLeadStatus(lead) === "negotiation";
    default:
      return true;
  }
}

export function getLeadUrgency(lead: {
  followUpDate?: string | null;
  followUpDone: boolean;
}): "overdue" | "due" | "upcoming" | "none" {
  if (!lead.followUpDate || lead.followUpDone) return "none";

  const d = parseFollowUpMoment(lead.followUpDate);
  if (!d) return "none";

  const now = new Date();

  if (followUpHasTime(d)) {
    if (now.getTime() > d.getTime()) return "overdue";
    if (isToday(lead.followUpDate)) return "due";
    return "upcoming";
  }

  if (isOverdue(lead.followUpDate)) return "overdue";
  if (isToday(lead.followUpDate)) return "due";
  return "upcoming";
}

/** Today page: follow-up is today and scheduled time has not passed yet. */
export function shouldShowOnTodayPage(
  lead: {
    followUpDate?: string | null;
    followUpDone: boolean;
  },
  now: Date = new Date(),
): boolean {
  if (!lead.followUpDate || lead.followUpDone) return false;
  if (!isToday(lead.followUpDate)) return false;

  const d = parseFollowUpMoment(lead.followUpDate);
  if (!d) return false;

  if (followUpHasTime(d)) {
    return now.getTime() <= d.getTime();
  }

  return true;
}

/** Today follow-up with a set time that has already passed (hidden from Today list). */
export function isTodayFollowUpTimePassed(
  lead: {
    followUpDate?: string | null;
    followUpDone: boolean;
  },
  now: Date = new Date(),
): boolean {
  if (!lead.followUpDate || lead.followUpDone) return false;
  if (!isToday(lead.followUpDate)) return false;

  const d = parseFollowUpMoment(lead.followUpDate);
  if (!d || !followUpHasTime(d)) return false;

  return now.getTime() > d.getTime();
}

export type PropertyStatus = "available" | "reserved" | "sold";

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

export function getPropertyStatus(property: {
  availability?: string | null;
}): PropertyStatus {
  const value = property.availability?.toLowerCase().trim() ?? "";
  if (value.includes("sold")) return "sold";
  if (value.includes("reserved")) return "reserved";
  return "available";
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
