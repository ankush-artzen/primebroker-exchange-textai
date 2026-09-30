"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: Props) {
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-2.5">
      <p className="text-[12.5px] text-muted">
        {start}–{end} of {total}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-primary transition-colors",
            page <= 1
              ? "cursor-not-allowed opacity-40"
              : "active:bg-background",
          )}
        >
          <ChevronLeft size={18} />
        </button>

        <span className="min-w-[3.5rem] text-center text-[12.5px] font-medium text-primary">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-primary transition-colors",
            page >= totalPages
              ? "cursor-not-allowed opacity-40"
              : "active:bg-background",
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
