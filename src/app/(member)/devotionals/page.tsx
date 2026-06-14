"use client";

import { useCallback } from "react";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ContentCard } from "@/components/content/ContentCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Devotional {
  id: string;
  topic?: string;
  title?: string;
  verse?: string;
  dayNumber?: number;
  weekNumber?: string;
  weekTheme?: string;
  likesCount: number;
}

export default function DevotionalsPage() {
  const fetchFn = useCallback(async (page: number) => {
    const res = await fetch(`/api/devotionals?page=${page}&limit=10`);
    return res.json();
  }, []);

  const { items: devotionals, loading, hasMore, loaderRef } = useInfiniteScroll<Devotional>({ fetchFn });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Daily Devotionals</h1>
        <p className="text-navy/60 font-body mt-1">Start each day with purpose and faith.</p>
      </div>

      {devotionals.length === 0 && !loading ? (
        <p className="text-center text-navy/50 font-body py-16">No devotionals available yet.</p>
      ) : (
        <div className="space-y-5">
          {devotionals.map((d, i) => {
            const displayTitle = d.topic ?? d.title ?? "Devotional";
            const weekMeta =
              d.weekNumber || d.weekTheme
                ? [d.weekNumber ? `Week ${d.weekNumber}` : null, d.weekTheme].filter(Boolean).join(" · ")
                : undefined;
            return (
              <ContentCard
                key={d.id}
                href={`/devotionals/${d.id}`}
                title={displayTitle}
                description={d.verse}
                meta={weekMeta}
                accent={i === 0 ? "gold" : "navy"}
                topRight={
                  i === 0 ? (
                    <span className="text-xs font-body text-gold-dark font-semibold">Latest</span>
                  ) : undefined
                }
                likesCount={d.likesCount ?? 0}
                leading={
                  <div className="flex-shrink-0 text-center min-w-[48px]">
                    {d.dayNumber ? (
                      <>
                        <p className="font-heading text-2xl font-bold text-navy leading-none">{d.dayNumber}</p>
                        <p className="text-[10px] text-navy/40 font-body uppercase tracking-wide mt-0.5">Day</p>
                      </>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cream-dark" />
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      <div ref={loaderRef} className="h-10" />
      {loading && <p className="text-center py-6 text-navy/40 font-body text-sm">Loading…</p>}
      {!hasMore && devotionals.length > 0 && (
        <p className="text-center py-4 text-navy/30 font-body text-xs">All {devotionals.length} devotionals loaded</p>
      )}

      <ScrollToTop />
    </div>
  );
}
