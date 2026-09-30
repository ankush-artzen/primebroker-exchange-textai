"use client";

import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { phoneDialLink, whatsappLink } from "@/lib/utils";

interface Props {
  phone: string;
  whatsappMessage?: string;
  compact?: boolean;
  iconOnly?: boolean;
  size?: "sm" | "md";
}

export function CallWhatsAppButtons({
  phone,
  whatsappMessage,
  compact,
  iconOnly,
  size = "md",
}: Props) {
  const iconSize = size === "sm" ? 15 : 18;
  const btnClass =
    size === "sm"
      ? "flex h-[34px] w-[34px] items-center justify-center rounded-full transition-transform active:scale-95"
      : "flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95";

  if (iconOnly) {
    return (
      <div className="flex shrink-0 gap-2">
        <a
          href={phoneDialLink(phone)}
          aria-label="Call"
          className={cn(btnClass, "bg-call text-call-foreground")}
        >
          <Phone size={iconSize} strokeWidth={2} />
        </a>
        <a
          href={whatsappLink(phone, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className={cn(btnClass, "bg-whatsapp text-whatsapp-foreground")}
        >
          <MessageCircle size={iconSize} strokeWidth={2} />
        </a>
      </div>
    );
  }

  return (
    <div className={cn(compact ? "flex gap-2" : "flex gap-3")}>
      <a
        href={phoneDialLink(phone)}
        className={
          compact
            ? "flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
            : "flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white active:bg-emerald-700"
        }
      >
        <Phone size={compact ? 16 : 18} />
        Call
      </a>

      <a
        href={whatsappLink(phone, whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className={
          compact
            ? "flex flex-1 items-center justify-center gap-2 rounded-lg bg-whatsapp-brand px-3 py-2 text-sm font-medium text-white"
            : "flex flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp-brand px-4 py-3 font-medium text-white active:bg-whatsapp-brand-active"
        }
      >
        <MessageCircle size={compact ? 16 : 18} />
        WhatsApp
      </a>
    </div>
  );
}
