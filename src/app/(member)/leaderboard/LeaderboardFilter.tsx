"use client";

import { useRouter, useSearchParams } from "next/navigation";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  currentMonth: number; // 1-12
  currentYear: number;
}

export default function LeaderboardFilter({ currentMonth, currentYear }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedMonth = Number(searchParams.get("month") ?? currentMonth);
  const selectedYear = Number(searchParams.get("year") ?? currentYear);

  // Build year options: current year back 3 years
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  function navigate(month: number, year: number) {
    router.push(`/leaderboard?month=${month}&year=${year}`);
  }

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      <select
        value={selectedMonth}
        onChange={(e) => navigate(Number(e.target.value), selectedYear)}
        className="rounded-xl border border-cream-dark bg-white text-navy font-body text-sm px-3 py-2 focus:outline-none focus:border-navy/30 cursor-pointer"
      >
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => navigate(selectedMonth, Number(e.target.value))}
        className="rounded-xl border border-cream-dark bg-white text-navy font-body text-sm px-3 py-2 focus:outline-none focus:border-navy/30 cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
