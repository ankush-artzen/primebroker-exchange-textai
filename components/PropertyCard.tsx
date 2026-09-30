"use client";

import type { Property } from "@/lib/types";
import { cn, getPropertyStatus } from "@/lib/utils";
import { House, Images, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import { TruncatedText } from "./TruncatedText";

interface Props {
  property: Property;
  onClick: () => void;
}

const statusStyles = {
  available: {
    label: "Available",
    className: "bg-ok/90 text-white",
    stripe: "bg-ok",
  },
  reserved: {
    label: "Reserved",
    className: "bg-today/90 text-white",
    stripe: "bg-today",
  },
  sold: {
    label: "Sold",
    className: "bg-muted/90 text-white",
    stripe: "bg-muted",
  },
} as const;

export function PropertyCard({ property, onClick }: Props) {
  const thumb = property.photoUrls[0];
  const photoCount = property.photoUrls.length;
  const status = getPropertyStatus(property);
  const tag = statusStyles[status];

  return (
    <article className="group overflow-hidden rounded-[14px] border border-border/70 bg-surface shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col text-left active:opacity-95"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-upcoming">
          {thumb ? (
            <Image
              src={thumb}
              alt={property.title}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-upcoming to-secondary-tint/40 text-muted">
              <House size={32} strokeWidth={1.5} />
              <span className="text-[11px] font-medium">No photo</span>
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/5"
            aria-hidden
          />

          <span
            className={cn(
              "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm",
              tag.className,
            )}
          >
            {tag.label}
          </span>

          {photoCount > 1 && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Images size={11} strokeWidth={2.25} />
              {photoCount}
            </span>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-serif text-[1.35rem] leading-none text-white drop-shadow-sm">
              {property.price}
            </p>
          </div>
        </div>

        <div className="flex min-h-0">
          <div
            className={cn("w-1 shrink-0", tag.stripe)}
            aria-hidden
          />

          <div className="min-w-0 flex-1 p-3.5">
            <TruncatedText
              as="span"
              className="text-[15px] font-semibold leading-snug text-primary"
            >
              {property.title}
            </TruncatedText>

            {(property.configuration || property.location) && (
              <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted">
                {property.configuration && (
                  <span className="shrink-0 rounded-md bg-background px-1.5 py-0.5 text-[11px] font-medium text-primary">
                    {property.configuration}
                  </span>
                )}
                {property.location && (
                  <>
                    {property.configuration && (
                      <span className="shrink-0 text-border">•</span>
                    )}
                    <MapPin size={12} className="shrink-0" />
                    {/* <TruncatedText
                      as="span"
                      wrapperClassName="min-w-0 flex-1"
                      className="text-[12.5px] text-muted"
                    >
                      {property.location}
                    </TruncatedText> */}

{/* <TruncatedText
  as="span"
  wrapperClassName="min-w-0 flex-1 overflow-hidden"
  className="block truncate text-[12.5px] text-muted"
>
  {property.location}
</TruncatedText> */}
<span
  title={property.location}
  className="min-w-0 flex-1 overflow-hidden"
>
  <TruncatedText
    as="span"
    className="block truncate text-[12.5px] text-muted"
  >
    {property.location}
  </TruncatedText>
</span>
                  </>
                )}
              </div>
            )}

            {property.area && (
              <p className="mt-2 inline-flex max-w-full items-center gap-1 text-[12px] font-medium text-primary">
                <Ruler size={12} className="shrink-0 text-muted" />
                <span className="truncate">{property.area}</span>
              </p>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}
