"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BibleVersePicker } from "@/components/ui/BibleVersePicker";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";

interface VerseValue { reference: string; text: string; translation: string; }

export default function EditDevotionalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [content, setContent] = useState<object | null>(null);
  const [verse, setVerse] = useState<VerseValue | null>(null);
  const [form, setForm] = useState({
    topic: "",
    dayNumber: "",
    weekNumber: "",
    weekTheme: "",
    status: "pending",
  });

  useEffect(() => {
    fetch(`/api/devotionals/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setForm({
          topic: data.topic ?? data.title ?? "",
          dayNumber: String(data.dayNumber ?? ""),
          weekNumber: data.weekNumber ?? "",
          weekTheme: data.weekTheme ?? "",
          status: data.status ?? "pending",
        });
        if (data.verse) {
          setVerse({
            reference: data.verse,
            text: data.verseText ?? "",
            translation: data.verseTranslation ?? "KJV",
          });
        }
        setContent(data.content ?? null);
      })
      .catch(() => toast.error("Failed to load devotional"))
      .finally(() => setFetching(false));
  }, [id]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/devotionals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: form.topic,
        title: form.topic, // keep legacy field in sync
        dayNumber: parseInt(form.dayNumber) || 1,
        weekNumber: form.weekNumber,
        weekTheme: form.weekTheme,
        status: form.status,
        verse: verse?.reference ?? null,
        verseText: verse?.text ?? null,
        verseTranslation: verse?.translation ?? null,
        content,
      }),
    });
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
          <BibleVersePicker value={verse} onChange={setVerse} label="Main Scripture Reference" />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Day Number"
              type="number"
              min="1"
              value={form.dayNumber}
              onChange={(e) => set("dayNumber", e.target.value)}
            />
            <Input
              label="Week Number"
              placeholder="e.g. 01"
              value={form.weekNumber}
              onChange={(e) => set("weekNumber", e.target.value)}
            />
          </div>

          <Input
            label="Week Theme"
            placeholder="e.g. Walking in Faith"
            value={form.weekTheme}
            onChange={(e) => set("weekTheme", e.target.value)}
          />

          <Input
            label="Topic *"
            placeholder="e.g. The Grace of God"
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
            required
          />
        </div>

        {content !== null && <RichTextEditor value={content} onChange={setContent} />}

        <div className="flex items-center gap-4">
          {form.status === "draft" && (
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              options={[
                { value: "draft", label: "Keep as Draft" },
                { value: "approved", label: "Publish" },
              ]}
            />
          )}
          <Button type="submit" loading={loading}>Save Changes</Button>
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">Delete</Button>
        </div>
      </form>
    </div>
  );
}
