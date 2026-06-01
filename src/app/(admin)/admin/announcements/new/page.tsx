"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", isUrgent: false, expiresAt: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Failed to create"); return; }
      toast.success("Announcement created! SMS sent to all members.");
      router.push("/admin/announcements");
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/announcements" className="text-navy/50 hover:text-navy font-body text-sm">← Announcements</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">New Announcement</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Title *" placeholder="Announcement title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy font-body">Message *</label>
            <textarea rows={5} required placeholder="Write the announcement message…"
              className="rounded-md border border-cream-dark bg-white px-3 py-2 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </div>
          <Input label="Expires On (optional)" type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isUrgent} onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))}
              className="w-4 h-4 rounded accent-burgundy" />
            <div>
              <span className="text-sm font-body font-medium text-navy">Mark as Urgent</span>
              <p className="text-xs text-navy/50 font-body">Urgent announcements are highlighted prominently.</p>
            </div>
          </label>
        </div>
        <p className="text-xs text-navy/50 font-body">📱 An SMS will automatically be sent to all active members when you publish.</p>
        <Button type="submit" loading={loading} size="lg">Publish Announcement</Button>
      </form>
    </div>
  );
}
