"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BibleVersePicker } from "@/components/ui/BibleVersePicker";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import toast from "react-hot-toast";
import Link from "next/link";

interface VerseValue { reference: string; text: string; translation: string; }

export default function NewDevotionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<object | null>(null);
  const [verse, setVerse] = useState<VerseValue | null>(null);
  const [form, setForm] = useState({
    topic: "",
    dayNumber: "",
    weekNumber: "",
    weekTheme: "",
    status: "draft",
  });

  useEffect(() => {
    // Auto-calculate next day number
    fetch("/api/devotionals/count")
      .then((r) => r.json())
      .then((data) => {
        const next = (data.count ?? 0) + 1;
        const week = String(Math.ceil(next / 7)).padStart(2, "0");
        setForm((f) => ({ ...f, dayNumber: String(next), weekNumber: week }));
      })
      .catch(() => {});
  }, []);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content) { toast.error("Please write the devotional content"); return; }
    if (!form.topic) { toast.error("Topic is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/devotionals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          dayNumber: parseInt(form.dayNumber) || 1,
          weekNumber: form.weekNumber,
          weekTheme: form.weekTheme,
          verse: verse?.reference,
          verseText: verse?.text,
          verseTranslation: verse?.translation,
          content,
          status: form.status,
        }),
      });
      if (!res.ok) { toast.error("Failed to create"); return; }
      toast.success(form.status === "draft" ? "Saved as draft." : "Devotional published!");
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <BibleVersePicker value={verse} onChange={setVerse} label="Main Scripture Reference" />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Day Number"
              type="number"
              min="1"
              placeholder="e.g. 4"
              value={form.dayNumber}
              onChange={(e) => {
                const d = parseInt(e.target.value) || 1;
                const week = String(Math.ceil(d / 7)).padStart(2, "0");
                setForm((f) => ({ ...f, dayNumber: e.target.value, weekNumber: week }));
              }}
              hint="Auto-calculated from existing entries"
            />
            <Input
              label="Week Number"
              placeholder="e.g. 01"
              value={form.weekNumber}
              onChange={(e) => set("weekNumber", e.target.value)}
              hint="Auto-set from day number"
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

        <div>
          <label className="block text-sm font-medium text-navy font-body mb-2">Devotional Content *</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Write the devotional message…" />
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={[
              { value: "draft", label: "Save as Draft" },
              { value: "approved", label: "Publish" },
            ]}
          />
          <Button type="submit" loading={loading} size="lg">
            {form.status === "draft" ? "Save Draft" : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
