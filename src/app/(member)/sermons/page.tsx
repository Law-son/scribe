"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Sermons</h1>
        <p className="text-navy/60 font-body mt-1">Messages to inspire and strengthen your faith.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sermons…"
            className="flex-1 h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button
            type="submit"
            className="h-10 px-4 bg-navy text-cream rounded-lg text-sm font-body hover:bg-navy-light transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {sermons.length === 0 && !loading ? (
        <p className="text-center text-navy/50 font-body py-16">No sermons found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sermons.map((s) => (
            <Link key={s.id} href={`/sermons/${s.id}`}>
              <div className="bg-white border border-cream-dark rounded-xl p-6 hover:border-navy/30 hover:shadow-md transition-all h-full">
                <div className="flex flex-wrap gap-2 mb-3">
                  {s.tags?.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="navy">{tag}</Badge>
                  ))}
                </div>
                <h2 className="font-heading text-lg font-semibold text-navy mb-1 leading-snug">{s.title}</h2>
                <p className="text-sm text-navy/60 font-body">{s.preacher}</p>
                <p className="text-xs text-gray-400 font-body mt-1">
                  {format(new Date(s.date ?? s.publishedAt ?? s.createdAt), "MMMM d, yyyy")}
                </p>
                <div className="flex gap-4 mt-4 text-xs text-gray-400 font-body">
                  <span>👁 {s.viewsCount ?? 0}</span>
                  <span>❤️ {s.likesCount ?? 0}</span>
                </div>
              </div>
            </Link>
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
