"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ text: "", author: "", status: "published" });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Failed to create"); return; }
      toast.success(form.status === "published" ? "Quote published!" : "Saved as draft.");
      router.push("/admin/quotes");
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/quotes" className="text-navy/50 hover:text-navy font-body text-sm">← Quotes</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">New Quote</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy font-body">Quote Text *</label>
            <textarea rows={4} placeholder="Enter the inspirational quote…" required
              className="rounded-md border border-cream-dark bg-white px-3 py-2 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              value={form.text} onChange={(e) => set("text", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy font-body">Author *</label>
            <input required placeholder="e.g. Pastor Mike" value={form.author} onChange={(e) => set("author", e.target.value)}
              className="h-10 rounded-md border border-cream-dark bg-white px-3 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "published", label: "Publish & Notify Members" }, { value: "draft", label: "Save as Draft" }]} />
          <Button type="submit" loading={loading}>{form.status === "published" ? "Publish" : "Save Draft"}</Button>
        </div>
      </form>
    </div>
  );
}
