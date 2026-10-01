"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function OwnerFilter({
  users,
  value,
  onChange,
  searchable = false,
  query = "",
  onQueryChange,
  placeholder = "Search a user name",
}: {
  users: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  searchable?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!searchable) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [searchable]);

  const matches = useMemo(() => {
    const needle = debouncedQuery.toLowerCase();
    if (!needle) return users;
    return users.filter((user) => user.name.toLowerCase().includes(needle));
  }, [users, debouncedQuery]);

  if (!searchable) {
    return (
      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          User
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
        >
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const selected = users.find((user) => user.id === value);

  return (
    <div ref={rootRef} className="relative mb-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        Search name
      </label>
      <input
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          onQueryChange?.(event.target.value);
          if (value) onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-primary"
      />
      {selected && !query && (
        <p className="mt-1 text-xs text-muted">Showing {selected.name}</p>
      )}
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[10px] border border-border bg-surface py-1 shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => {
                onChange("");
                onQueryChange?.("");
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-background"
            >
              All users
            </button>
          </li>
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No matching users.</li>
          ) : (
            matches.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(user.id);
                    onQueryChange?.(user.name);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-background"
                >
                  {user.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
