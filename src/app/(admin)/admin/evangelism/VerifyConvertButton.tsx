"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Props { id: string; action: "verify" | "reject"; }

export function VerifyConvertButton({ id, action }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    const res = await fetch(`/api/evangelism/${id}/verify`, { method: action === "verify" ? "POST" : "DELETE" });
    if (res.ok) {
      toast.success(action === "verify" ? "Convert verified! +15 pts awarded." : "Rejected.");
      router.refresh();
    } else {
      toast.error("Failed");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`text-sm font-body px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        action === "verify"
          ? "bg-forest text-cream hover:bg-forest-dark"
          : "bg-burgundy/10 text-burgundy hover:bg-burgundy/20"
      }`}
    >
      {loading ? "…" : action === "verify" ? "Verify" : "Reject"}
    </button>
  );
}
