"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ContentCard } from "@/components/content/ContentCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date?: string;
  publishedAt?: string;
  createdAt: string;
  likesCount: number;
  viewsCount: number;
  tags?: string[];
}

export default function SermonsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const fetchFn = useCallback(
    async (page: number) => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (query) params.set("search", query);
      const res = await fetch(`/api/sermons?${params}`);
      return res.json();
    },
    [query]
  );

  const { items: sermons, loading, hasMore, loaderRef } = useInfiniteScroll<Sermon>({ fetchFn });

  useDebounce(search, 300, (val) => setQuery(val.trim()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Sermons</h1>
        <p className="text-navy/60 font-body mt-1">Messages to inspire and strengthen your faith.</p>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sermons…"
          className="w-full h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      {sermons.length === 0 && !loading ? (
        <p className="text-center text-navy/50 font-body py-16">No sermons found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {sermons.map((s) => (
            <ContentCard
              key={s.id}
              href={`/sermons/${s.id}`}
              title={s.title}
              description={s.preacher}
              meta={format(new Date(s.date ?? s.publishedAt ?? s.createdAt), "MMMM d, yyyy")}
              accent="gold"
              badges={s.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="navy">{tag}</Badge>
              ))}
              viewsCount={s.viewsCount ?? 0}
              likesCount={s.likesCount ?? 0}
            />
          ))}
        </div>
      )}

      <div ref={loaderRef} className="h-10" />
      {loading && <p className="text-center py-6 text-navy/40 font-body text-sm">Loading…</p>}
      {!hasMore && sermons.length > 0 && (
        <p className="text-center py-4 text-navy/30 font-body text-xs">All {sermons.length} sermons loaded</p>
      )}

      <ScrollToTop />
    </div>
  );
}
