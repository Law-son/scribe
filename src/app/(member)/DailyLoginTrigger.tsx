"use client";

import { useEffect } from "react";

export default function DailyLoginTrigger() {
  useEffect(() => {
    // Fire-and-forget daily login point — server is idempotent
    fetch("/api/points/daily-login", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
