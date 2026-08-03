"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  currentMonth: number;
  currentYear: number;
  compareMonth?: number;
  compareYear?: number;
}

export function AttendanceMonthFilter({ currentMonth, currentYear, compareMonth, compareYear }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={currentMonth}
        onChange={(e) => navigate({ month: e.target.value, year: String(currentYear) })}
        className="rounded-lg border border-cream-dark bg-white text-navy font-body text-sm px-3 py-2 focus:outline-none focus:border-navy/30 cursor-pointer"
      >
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={currentYear}
        onChange={(e) => navigate({ month: String(currentMonth), year: e.target.value })}
        className="rounded-lg border border-cream-dark bg-white text-navy font-body text-sm px-3 py-2 focus:outline-none focus:border-navy/30 cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <span className="text-sm text-navy/40 font-body px-1">vs</span>

      <select
        value={compareMonth ?? ""}
        onChange={(e) => {
          if (!e.target.value) navigate({ compareMonth: undefined, compareYear: undefined });
          else navigate({ compareMonth: e.target.value, compareYear: String(compareYear ?? currentYear) });
        }}
        className="rounded-lg border border-cream-dark bg-white text-navy font-body text-sm px-3 py-2 focus:outline-none focus:border-navy/30 cursor-pointer"
      >
        <option value="">None</option>
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      {compareMonth && (
        <select
          value={compareYear ?? currentYear}
          onChange={(e) => navigate({ compareMonth: String(compareMonth), compareYear: e.target.value })}
          className="rounded-lg border border-cream-dark bg-white text-navy font-body text-sm px-3 py-2 focus:outline-none focus:border-navy/30 cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}
    </div>
  );
}
