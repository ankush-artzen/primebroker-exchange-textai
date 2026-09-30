"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: string;
  className?: string;
  wrapperClassName?: string;
  as?: "p" | "span";
}

export function TruncatedText({
  children,
  className,
  wrapperClassName,
  as: Tag = "p",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollWidth > el.clientWidth);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  return (
    <span
      className={cn(
        "group/truncate relative block min-w-0",
        wrapperClassName,
      )}
    >
      <Tag ref={ref as never} className={cn("truncate", className)}>
        {children}
      </Tag>
      {truncated && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden max-w-[min(100vw-2rem,20rem)] rounded-lg bg-primary px-2.5 py-1.5 text-[11px] leading-snug text-primary-foreground opacity-0 shadow-md transition-opacity group-hover/truncate:opacity-100 md:block"
        >
          {children}
        </span>
      )}
    </span>
  );
}
