"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";

interface Activity {
  id: string;
  actorName: string;
  action: string;
  targetType?: string;
  targetLabel?: string;
  createdAt: string;
}

const actionColor = (action: string) => {
  if (/promoted|admin/i.test(action)) return "bg-gold/10 text-gold-dark border-gold/20";
  if (/suspended|demoted|rejected/i.test(action)) return "bg-burgundy/10 text-burgundy border-burgundy/20";
  if (/verified|activated|published/i.test(action)) return "bg-forest/10 text-forest border-forest/20";
  return "bg-navy/5 text-navy/70 border-navy/10";
};

const actionIcon = (action: string) => {
  if (/promoted/i.test(action)) return "⭐";
  if (/demoted|suspended/i.test(action)) return "🚫";
  if (/verified|activated/i.test(action)) return "✅";
  if (/updated|profile/i.test(action)) return "✏️";
  if (/published|created/i.test(action)) return "📝";
  if (/rejected/i.test(action)) return "❌";
  return "🔹";
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activities?page=${p}`);
      const json = await res.json();
      const items: Activity[] = json.data ?? [];
      setActivities((prev) => (p === 1 ? items : [...prev, ...items]));
      setTotalPages(json.totalPages ?? 1);
      setHasMore(p < (json.totalPages ?? 1));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          loadPage(next);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, loadPage]);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-navy font-bold">Admin Activities</h1>
        <p className="text-navy/50 font-body text-sm mt-1">
          A transparent log of all administrative actions taken on the platform.
        </p>
      </div>

      {activities.length === 0 && !loading ? (
        <div className="text-center py-20 text-navy/40 font-body">
          No activities recorded yet.
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-cream-dark" />

          <div className="space-y-1">
            {activities.map((a) => (
              <div key={a.id} className="flex gap-4 relative pl-14">
                {/* Dot */}
                <div className="absolute left-3.5 top-3 w-3 h-3 rounded-full bg-white border-2 border-navy/20" />

                <div className="flex-1 bg-white border border-cream-dark rounded-xl p-4 hover:border-navy/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-navy leading-snug">
                        <span className="font-semibold text-navy">{a.actorName}</span>{" "}
                        <span className="mr-1">{actionIcon(a.action)}</span>
                        {a.action}
                      </p>
                      {a.targetType && a.targetLabel && (
                        <p className="text-xs text-navy/40 font-body mt-0.5">
                          {a.targetType}: {a.targetLabel}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`inline-block text-[10px] font-body font-medium px-2 py-0.5 rounded-full border ${actionColor(a.action)}`}>
                        {a.targetType ?? "system"}
                      </span>
                      <p className="text-[10px] text-navy/30 font-body mt-1">
                        {format(new Date(a.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="h-8" />
          {loading && (
            <p className="text-center text-navy/40 font-body text-sm py-4">Loading…</p>
          )}
          {!hasMore && activities.length > 0 && (
            <p className="text-center text-navy/30 font-body text-xs py-4">
              All activities loaded · {activities.length} total
            </p>
          )}
        </div>
      )}
    </div>
  );
}
