"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function TablePagination({ currentPage, totalPages, total, pageSize }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function pageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-cream-dark bg-cream-light/50">
      <p className="text-xs text-navy/50 font-body">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        {currentPage > 1 ? (
          <Link href={pageHref(currentPage - 1)} className="px-2.5 py-1.5 rounded-md text-xs font-body text-navy/60 hover:bg-cream-dark hover:text-navy transition-colors">
            ← Prev
          </Link>
        ) : (
          <span className="px-2.5 py-1.5 rounded-md text-xs font-body text-navy/30 cursor-default">← Prev</span>
        )}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-navy/30 font-body">…</span>
          ) : (
            <Link
              key={p}
              href={pageHref(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-body transition-colors ${
                p === currentPage
                  ? "bg-navy text-cream font-semibold"
                  : "text-navy/60 hover:bg-cream-dark hover:text-navy"
              }`}
            >
              {p}
            </Link>
          )
        )}
        {currentPage < totalPages ? (
          <Link href={pageHref(currentPage + 1)} className="px-2.5 py-1.5 rounded-md text-xs font-body text-navy/60 hover:bg-cream-dark hover:text-navy transition-colors">
            Next →
          </Link>
        ) : (
          <span className="px-2.5 py-1.5 rounded-md text-xs font-body text-navy/30 cursor-default">Next →</span>
        )}
      </div>
    </div>
  );
}
