"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { fieldErrorBorder, fieldErrorText } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/Loader";

export type PlaceHit = {
  label: string;
  name: string;
  city: string;
  locality: string;
  subLocality: string;
  lat: number;
  lon: number;
};

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceHit) => void;
  placeholder?: string;
  error?: string;
  kind?: "city" | "place";
  near?: string;
}

export function PlaceSearch({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  error,
  kind = "place",
  near,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const skipSearch = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const trimmed = query.trim();
    if (!open || trimmed.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: trimmed, kind });
        if (near?.trim() && kind !== "city") params.set("near", near.trim());
        const res = await fetch(`/api/geocode/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok || controller.signal.aborted) return;
        const data = (await res.json()) as { results?: PlaceHit[] };
        setResults(data.results ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 600);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, kind, near]);

  const choose = (place: PlaceHit) => {
    const next = kind === "city" ? place.city || place.name : place.locality || place.name;
    skipSearch.current = true;
    setQuery(next);
    setOpen(false);
    setResults([]);
    onChange(next);
    onSelect(place);
  };

  return (
    <div ref={rootRef} className="relative" data-field-error={error ? "true" : undefined}>
      <p className="mb-2 text-[13px] font-medium text-foreground">{label}</p>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(event.target.value);
            setOpen(true);
          }}
          className={cn(
            "w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-base text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/25",
            error && fieldErrorBorder,
          )}
        />
        {searching && (
          <Spinner
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {results.map((place, index) => (
            <li key={`${place.lat}-${place.lon}-${place.label}-${index}`}>
              <button
                type="button"
                onClick={() => choose(place)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-background"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {place.name}
                  </span>
                  <span className="block truncate text-[12px] text-muted">{place.label}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className={fieldErrorText}>{error}</p>}
    </div>
  );
}
