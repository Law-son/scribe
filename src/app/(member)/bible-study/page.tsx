"use client";

import { useState, useCallback } from "react";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ContentCard } from "@/components/content/ContentCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
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

  useDebounce(search, 300, (val) => setQuery(val.trim()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Bible Study Notes</h1>
        <p className="text-navy/60 font-body mt-1">Deepen your understanding of Scripture.</p>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="w-full h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      {notes.length === 0 && !loading ? (
        <p className="text-center text-navy/50 font-body py-16">No notes found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {notes.map((n) => {
            const displayTopic = n.topic ?? n.title ?? "Bible Study";
            return (
              <ContentCard
                key={n.id}
                href={`/bible-study/${n.id}`}
                title={displayTopic}
                meta={format(new Date(n.date ?? n.publishedAt ?? new Date()), "MMMM d, yyyy")}
                accent="forest"
                viewsCount={n.viewsCount ?? 0}
                likesCount={n.likesCount ?? 0}
              />
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
