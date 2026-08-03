"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

interface Props {
  initialDate: string;
  initialSearch: string;
}

export function AttendanceDaySearch({ initialDate, initialSearch }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  function navigate(date: string, q: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date);
    if (q) params.set("search", q);
    else params.delete("search");
    router.push(`${pathname}?${params}`);
  }

  const runSearch = useCallback(
    (q: string) => navigate(initialDate, q),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialDate]
  );

  useDebounce(search, 300, runSearch);

  return (
    <div className="flex items-center gap-3 flex-wrap mb-5">
      <input
        type="date"
        value={initialDate}
        onChange={(e) => navigate(e.target.value, search)}
        className="h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
      />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or phone…"
        className="flex-1 min-w-[200px] h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
      />
    </div>
  );
}
