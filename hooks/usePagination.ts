"use client";

import { useEffect, useMemo, useState } from "react";

export const LIST_PAGE_SIZE = 10;

export function usePagination<T>(
  items: T[],
  resetKey?: string | number,
  pageSize = LIST_PAGE_SIZE,
) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    pageSize,
    total: items.length,
  };
}
