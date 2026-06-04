"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditDevotionalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [content, setContent] = useState<object | null>(null);
  const [form, setForm] = useState({ title: "", verse: "", verseText: "", scheduledAt: "" });

  useEffect(() => {
    fetch(`/api/devotionals/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setForm({ title: data.title ?? "", verse: data.verse ?? "", verseText: data.verseText ?? "", scheduledAt: data.scheduledAt ? data.scheduledAt.slice(0, 16) : "" });
        setContent(data.content ?? null);
      })
      .catch(() => toast.error("Failed to load devotional"))
      .finally(() => setFetching(false));
  }, [id]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/devotionals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, content }) });
    if (res.ok) { toast.success("Updated!"); router.push("/admin/devotionals"); }
    else toast.error("Failed to update");
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this devotional?")) return;
    await fetch(`/api/devotionals/${id}`, { method: "DELETE" });
    toast.success("Deleted"); router.push("/admin/devotionals");
  }

  if (fetching) return <PageLoader />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/devotionals" className="text-navy/50 hover:text-navy font-body text-sm">← Devotionals</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">Edit Devotional</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <Input label="Scheduled Date" type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
          <Input label="Scripture Reference" value={form.verse} onChange={(e) => set("verse", e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy font-body">Scripture Text</label>
            <textarea rows={3} className="rounded-md border border-cream-dark bg-white px-3 py-2 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              value={form.verseText} onChange={(e) => set("verseText", e.target.value)} />
          </div>
        </div>
        {content !== null && <RichTextEditor value={content} onChange={setContent} />}
        <div className="flex items-center gap-4">
          <Button type="submit" loading={loading}>Save Changes</Button>
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">Delete</Button>
        </div>
      </form>
    </div>
  );
}
