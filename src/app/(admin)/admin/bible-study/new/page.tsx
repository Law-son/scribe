"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewBibleStudyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<object | null>(null);
  const [form, setForm] = useState({ title: "", topic: "", date: "", category: "", status: "draft" });
  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content) { toast.error("Please write the content"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/bible-study", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, content, date: form.date || new Date().toISOString() }),
      });
      if (!res.ok) { toast.error("Failed to create"); return; }
      toast.success(form.status === "published" ? "Published!" : "Saved as draft.");
      router.push("/admin/bible-study");
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/bible-study" className="text-navy/50 hover:text-navy font-body text-sm">← Bible Study</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">New Note</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Title *" placeholder="Study title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Topic *" placeholder="Main topic" value={form.topic} onChange={(e) => set("topic", e.target.value)} required />
            <Input label="Category" placeholder="e.g. Prophecy" value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <Input label="Date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy font-body mb-2">Content *</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Write the Bible study notes…" />
        </div>
        <div className="flex items-center gap-4">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "draft", label: "Save as Draft" }, { value: "published", label: "Publish & Notify" }]} />
          <Button type="submit" loading={loading} size="lg">{form.status === "published" ? "Publish" : "Save Draft"}</Button>
        </div>
      </form>
    </div>
  );
}
