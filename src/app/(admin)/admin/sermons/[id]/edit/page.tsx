"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PreacherSearch } from "@/components/editor/PreacherSearch";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditSermonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [content, setContent] = useState<object | null>(null);
  const [form, setForm] = useState({
    title: "", preacher: "", date: "", videoUrl: "", tags: "", status: "draft",
  });

  useEffect(() => {
    fetch(`/api/sermons/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title ?? "",
          preacher: data.preacher ?? "",
          date: data.date ? data.date.slice(0, 10) : "",
          videoUrl: data.videoUrl ?? "",
          tags: (data.tags ?? []).join(", "),
          status: data.status ?? "draft",
        });
        setContent(data.content ?? null);
      })
      .finally(() => setFetching(false));
  }, [id]);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/sermons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, content, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      toast.success("Sermon updated!");
      router.push("/admin/sermons");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this sermon? This cannot be undone.")) return;
    await fetch(`/api/sermons/${id}`, { method: "DELETE" });
    toast.success("Sermon deleted");
    router.push("/admin/sermons");
  }

  if (fetching) return <PageLoader />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/sermons" className="text-navy/50 hover:text-navy font-body text-sm">← Sermons</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">Edit Sermon</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <div className="flex gap-4 items-end">
            <PreacherSearch value={form.preacher} onChange={(name) => set("preacher", name)} />
            <div className="flex-1">
              <Input label="Date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
          </div>
          <Input label="Video URL (optional)" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
          <Input label="Tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>
        {content !== null && (
          <RichTextEditor value={content} onChange={setContent} />
        )}
        <div className="flex items-center gap-4">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          <Button type="submit" loading={loading}>Save Changes</Button>
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">Delete</Button>
        </div>
      </form>
    </div>
  );
}
