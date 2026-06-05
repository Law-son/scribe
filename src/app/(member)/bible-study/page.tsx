"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { format } from "date-fns";

interface BibleStudy {
  id: string;
  topic?: string;
  title?: string;
  date?: string;
  publishedAt?: string;
  likesCount: number;
  viewsCount: number;
}

export default function BibleStudyPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const fetchFn = useCallback(
    async (page: number) => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (query) params.set("search", query);
      const res = await fetch(`/api/bible-study?${params}`);
      return res.json();
    },
    [query]
  );

  const { items: notes, loading, hasMore, loaderRef } = useInfiniteScroll<BibleStudy>({ fetchFn });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Bible Study Notes</h1>
        <p className="text-navy/60 font-body mt-1">Deepen your understanding of Scripture.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button type="submit" className="h-10 px-4 bg-navy text-cream rounded-lg text-sm font-body hover:bg-navy-light transition-colors">
            Search
          </button>
        </div>
      </form>

      {notes.length === 0 && !loading ? (
        <p className="text-center text-navy/50 font-body py-16">No notes found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((n) => {
            const displayTopic = n.topic ?? n.title ?? "Bible Study";
            return (
              <Link key={n.id} href={`/bible-study/${n.id}`}>
                <div className="bg-white border border-cream-dark rounded-xl p-6 hover:border-navy/30 hover:shadow-md transition-all h-full border-l-4 border-l-forest">
                  <h2 className="font-heading text-lg font-semibold text-navy mb-1 leading-snug">{displayTopic}</h2>
                  <p className="text-xs text-gray-400 font-body mt-1">
                    {format(new Date(n.date ?? n.publishedAt ?? new Date()), "MMMM d, yyyy")}
                  </p>
                  <div className="flex gap-4 mt-4 text-xs text-gray-400 font-body">
                    <span>👁 {n.viewsCount ?? 0}</span>
                    <span>❤️ {n.likesCount ?? 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div ref={loaderRef} className="h-10" />
      {loading && <p className="text-center py-6 text-navy/40 font-body text-sm">Loading…</p>}
      {!hasMore && notes.length > 0 && (
        <p className="text-center py-4 text-navy/30 font-body text-xs">All {notes.length} notes loaded</p>
      )}

      <ScrollToTop />
    </div>
  );
}
