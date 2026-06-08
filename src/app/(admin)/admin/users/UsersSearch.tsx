"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

export function UsersSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialValue);

  const runSearch = useCallback((q: string) => {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    router.push(params.size ? `${pathname}?${params}` : pathname);
  }, [router, pathname]);

  useDebounce(value, 300, runSearch);

  return (
    <div className="mb-6">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name or phone…"
        className="w-full max-w-md h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
      />
    </div>
  );
}
