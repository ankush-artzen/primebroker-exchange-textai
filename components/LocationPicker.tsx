"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, LocateFixed, MapPin, Pencil, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldErrorBorder, fieldErrorText } from "@/lib/form-errors";
import { Spinner } from "@/components/Loader";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-xl border border-border bg-surface md:h-64">
        <Spinner size={24} />
      </div>
    ),
  },
);

type LocationMode = "map" | "manual";

interface SearchResult {
  label: string;
  lat: number;
  lon: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function LocationPicker({ value, onChange, error }: Props) {
  const [mode, setMode] = useState<LocationMode>("map");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [manualText, setManualText] = useState(value);
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [preview, setPreview] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const initialized = useRef(false);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (!initialized.current && value.trim()) {
      initialized.current = true;
      setManualText(value);
      setQuery(value);
      setManualConfirmed(true);
    }
  }, [value]);

  const reverseGeocode = useCallback(
    async (nextLat: number, nextLon: number) => {
      setResolving(true);
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${nextLat}&lon=${nextLon}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { label?: string };
        if (data.label) {
          setQuery(data.label);
          onChange(data.label);
          setManualConfirmed(false);
          setPreview(null);
        }
      } finally {
        setResolving(false);
      }
    },
    [onChange],
  );

  const handlePick = useCallback(
    (nextLat: number, nextLon: number) => {
      setLat(nextLat);
      setLon(nextLon);
      setManualConfirmed(false);
      setPreview(null);
      void reverseGeocode(nextLat, nextLon);
    },
    [reverseGeocode],
  );

  const confirmPreview = (result: SearchResult) => {
    skipSearchRef.current = true;
    setQuery(result.label);
    onChange(result.label);
    setLat(result.lat);
    setLon(result.lon);
    setPreview(null);
    setManualConfirmed(false);
  };

  useEffect(() => {
    if (mode !== "map" || !query.trim() || query.length < 2 || skipSearchRef.current) {
      if (skipSearchRef.current) skipSearchRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results: SearchResult[] };
        const first = data.results[0] ?? null;
        setPreview(first);
        if (first) {
          setLat(first.lat);
          setLon(first.lon);
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, mode]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePick(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const confirmManual = () => {
    const trimmed = manualText.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setManualConfirmed(true);
    setLat(null);
    setLon(null);
    setPreview(null);
  };

  const switchMode = (nextMode: LocationMode) => {
    setMode(nextMode);
    if (nextMode === "manual") {
      setManualText(value);
      setManualConfirmed(false);
    }
  };

  const hasMapSelection = lat != null && lon != null && value.trim().length > 0;
  const hasManualSelection = manualConfirmed && value.trim().length > 0;
  const showSelected = hasMapSelection || hasManualSelection;

  return (
    <div className="space-y-3" data-field-error={error ? "true" : undefined}>
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-zinc-700">
          Location *
        </label>
        {resolving && mode === "map" && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Spinner size={12} className="text-muted" />
            Finding address…
          </span>
        )}
      </div>

      <div className="flex gap-2 rounded-xl bg-background p-1">
        <button
          type="button"
          onClick={() => switchMode("map")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors",
            mode === "map"
              ? "bg-surface text-primary shadow-sm"
              : "text-muted hover:text-primary",
          )}
        >
          <MapPin size={14} />
          Pick on map
        </button>
        <button
          type="button"
          onClick={() => switchMode("manual")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors",
            mode === "manual"
              ? "bg-surface text-primary shadow-sm"
              : "text-muted hover:text-primary",
          )}
        >
          <Pencil size={14} />
          Type manually
        </button>
      </div>

      {mode === "map" ? (
        <>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query || value}
              onChange={(e) => {
                setQuery(e.target.value);
                setLat(null);
                setLon(null);
                setPreview(null);
                setManualConfirmed(false);
                if (value) onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && preview) {
                  e.preventDefault();
                  confirmPreview(preview);
                }
              }}
              onFocus={() => {
                if (!query && value) setQuery(value);
              }}
              placeholder="Search area, sector, city…"
              className={cn(
                "w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
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

          <LocationPickerMap lat={lat} lon={lon} onPick={handlePick} />

          {preview && !value && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5">
              <p className="min-w-0 text-[12px] text-muted">
                Map shows &ldquo;{preview.label.split(",")[0]}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => confirmPreview(preview)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground"
              >
                <Check size={14} />
                Confirm
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-[12px] text-muted">
            <p className="flex items-center gap-1">
              <MapPin size={13} />
              Tap the map or drag the pin
            </p>
            <button
              type="button"
              onClick={useMyLocation}
              className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 font-medium text-primary transition-colors hover:bg-background"
            >
              <LocateFixed size={13} />
              My location
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <input
            value={manualText}
            onChange={(e) => {
              setManualText(e.target.value);
              setManualConfirmed(false);
            }}
            placeholder="e.g. Sector 66, Gurgaon"
            className={cn(
              "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
              error && fieldErrorBorder,
            )}
          />
          <button
            type="button"
            onClick={confirmManual}
            disabled={!manualText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            <Check size={16} />
            Use this location
          </button>
          <p className="text-[12px] text-muted">
            Type the address yourself — no map or GPS needed.
          </p>
        </div>
      )}

      {error && !showSelected && <p className={fieldErrorText}>{error}</p>}

      {showSelected && (
        <div className="flex items-start gap-2.5 rounded-xl border border-ok/30 bg-ok-tint px-3.5 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok/15 text-ok">
            <MapPin size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ok">
              Selected location
            </p>
            <p className="mt-0.5 text-sm font-medium leading-snug text-primary">
              {value}
            </p>
            {hasManualSelection && !hasMapSelection && (
              <p className="mt-1 text-[11px] text-muted">Entered manually</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
