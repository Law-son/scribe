"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function ApproveDevotionalButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function approve() {
    setLoading(true);
    const res = await fetch(`/api/devotionals/${id}/approve`, { method: "POST" });
    if (res.ok) {
      toast.success("Devotional approved!");
      router.refresh();
    } else {
      toast.error("Failed to approve");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="text-sm text-forest hover:underline font-body disabled:opacity-50"
    >
      {loading ? "…" : "Approve"}
    </button>
  );
}
