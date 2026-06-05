"use client";

import { useCallback } from "react";
import { LikeButton } from "@/components/content/LikeButton";
import { ShareButton } from "@/components/content/ShareButton";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Quote {
  id: string;
  text: string;
  author: string;
  likesCount: number;
  isLiked?: boolean;
}

export default function QuotesPage() {
  const fetchFn = useCallback(async (page: number) => {
    const res = await fetch(`/api/quotes?page=${page}&limit=12`);
    return res.json();
  }, []);

  const { items: quotes, loading, hasMore, loaderRef } = useInfiniteScroll<Quote>({ fetchFn });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Inspirational Quotes</h1>
        <p className="text-navy/60 font-body mt-1">Words that light the path of faith.</p>
      </div>

      {quotes.length === 0 && !loading ? (
        <p className="text-center text-navy/50 font-body py-16">No quotes yet.</p>
      ) : (
        <div className="space-y-5">
          {quotes.map((q) => (
            <div key={q.id} className="bg-white border border-cream-dark rounded-2xl p-7 hover:border-gold/40 transition-colors">
              <p className="font-heading text-xl text-navy-dark italic leading-relaxed mb-4">
                &ldquo;{q.text}&rdquo;
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-body text-gold-dark font-medium">— {q.author}</span>
                <div className="flex items-center gap-2">
                  <LikeButton
                    contentType="quotes"
                    contentId={q.id}
                    initialLiked={q.isLiked ?? false}
                    initialCount={q.likesCount}
                  />
                  <ShareButton
                    title={`"${q.text}" — ${q.author}`}
                    text={`"${q.text}" — ${q.author}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={loaderRef} className="h-10" />
      {loading && <p className="text-center py-6 text-navy/40 font-body text-sm">Loading…</p>}
      {!hasMore && quotes.length > 0 && (
        <p className="text-center py-4 text-navy/30 font-body text-xs">All {quotes.length} quotes loaded</p>
      )}

      <ScrollToTop />
    </div>
  );
}
