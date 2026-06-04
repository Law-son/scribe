"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PreacherSearch } from "@/components/editor/PreacherSearch";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewSermonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<object | null>(null);
  const [form, setForm] = useState({
    title: "", preacher: "", date: "", videoUrl: "", tags: "", status: "draft",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content) { toast.error("Please write the sermon content"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          content,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          date: form.date || new Date().toISOString(),
        }),
      });
      if (!res.ok) { toast.error("Failed to create sermon"); return; }
      toast.success(form.status === "published" ? "Sermon published! SMS sent to members." : "Sermon saved as draft.");
      router.push("/admin/sermons");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/sermons" className="text-navy/50 hover:text-navy font-body text-sm">← Sermons</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">New Sermon</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Sermon Title *" placeholder="Enter the sermon title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <div className="flex gap-4 items-end">
            <PreacherSearch value={form.preacher} onChange={(name) => set("preacher", name)} />
            <div className="flex-1">
              <Input label="Sermon Date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
          </div>
          <Input label="Video URL (optional)" placeholder="https://youtube.com/watch?v=…" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
          <Input label="Tags (comma-separated)" placeholder="faith, prayer, grace" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy font-body mb-2">Sermon Content *</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Begin writing the sermon…" />
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={[{ value: "draft", label: "Save as Draft" }, { value: "published", label: "Publish & Notify Members" }]}
          />
          <Button type="submit" loading={loading} size="lg">
            {form.status === "published" ? "Publish Sermon" : "Save Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
