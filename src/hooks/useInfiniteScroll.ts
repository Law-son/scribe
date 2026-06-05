"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ data: T[]; totalPages: number }>;
}

export function useInfiniteScroll<T>({ fetchFn }: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetchFn(p);
        setItems((prev) => (p === 1 ? res.data : [...prev, ...res.data]));
        setHasMore(p < res.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn]
  );

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          load(next);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, load]);

  return { items, loading, hasMore, loaderRef };
}
