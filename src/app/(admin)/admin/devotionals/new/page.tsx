"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewDevotionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<object | null>(null);
  const [form, setForm] = useState({ title: "", verse: "", verseText: "", scheduledAt: "" });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content) { toast.error("Please write the devotional content"); return; }
    if (!form.scheduledAt) { toast.error("Please set a scheduled date"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/devotionals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, content }),
      });
      if (!res.ok) { toast.error("Failed to create"); return; }
      toast.success("Devotional saved. Awaiting approval before publishing.");
      router.push("/admin/devotionals");
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/devotionals" className="text-navy/50 hover:text-navy font-body text-sm">← Devotionals</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">New Devotional</h1>
      </div>
      <p className="text-sm text-navy/60 font-body mb-6 bg-gold/10 border border-gold/30 rounded-lg px-4 py-3">
        📋 Devotionals require admin approval before they become visible to members.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Title *" placeholder="Devotional title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <Input label="Scheduled Date *" type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} required />
          <Input label="Scripture Reference" placeholder="e.g. John 3:16" value={form.verse} onChange={(e) => set("verse", e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy font-body">Scripture Text</label>
            <textarea rows={3} placeholder="Type the verse here…" className="rounded-md border border-cream-dark bg-white px-3 py-2 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              value={form.verseText} onChange={(e) => set("verseText", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy font-body mb-2">Devotional Content *</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Write the devotional message…" />
        </div>
        <Button type="submit" loading={loading} size="lg">Save Devotional</Button>
      </form>
    </div>
  );
}
