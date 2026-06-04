"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DailyLoginTrigger() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/points/daily-login", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        // If points were actually awarded, refresh so the nav bar reflects the new total
        if (data.awarded) router.refresh();
      })
      .catch(() => {});
  }, []);

  return null;
}
