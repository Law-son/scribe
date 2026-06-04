"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditBibleStudyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [content, setContent] = useState<object | null>(null);
  const [form, setForm] = useState({ title: "", topic: "", date: "", category: "", status: "draft" });

  useEffect(() => {
    fetch(`/api/bible-study/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setForm({ title: data.title ?? "", topic: data.topic ?? "", date: data.date ? data.date.slice(0, 10) : "", category: data.category ?? "", status: data.status ?? "draft" });
        setContent(data.content ?? null);
      })
      .catch(() => toast.error("Failed to load content"))
      .finally(() => setFetching(false));
  }, [id]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/bible-study/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, content }) });
    if (res.ok) { toast.success("Updated!"); router.push("/admin/bible-study"); }
    else toast.error("Failed to update");
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/bible-study/${id}`, { method: "DELETE" });
    toast.success("Deleted"); router.push("/admin/bible-study");
  }

  if (fetching) return <PageLoader />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/bible-study" className="text-navy/50 hover:text-navy font-body text-sm">← Bible Study</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">Edit Note</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Topic" value={form.topic} onChange={(e) => set("topic", e.target.value)} required />
            <Input label="Category" value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <Input label="Date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        {content !== null && <RichTextEditor value={content} onChange={setContent} />}
        <div className="flex items-center gap-4">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          <Button type="submit" loading={loading}>Save Changes</Button>
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">Delete</Button>
        </div>
      </form>
    </div>
  );
}
