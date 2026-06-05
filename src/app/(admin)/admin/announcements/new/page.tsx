"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";

const MAX_CHARS = 160;
const POLL_INTERVAL = 1500; // ms

interface SmsStatus {
  total: number;
  sent: number;
  failed: number;
  done: boolean;
}

function SmsProgressView({ id, total }: { id: string; total: number }) {
  const [status, setStatus] = useState<SmsStatus>({ total, sent: 0, failed: 0, done: total === 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status.done) return;

    timerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/announcements/${id}/sms-status`);
        if (!res.ok) return;
        const data: SmsStatus = await res.json();
        setStatus(data);
        if (data.done && timerRef.current) clearInterval(timerRef.current);
      } catch {
        // network glitch — keep polling
      }
    }, POLL_INTERVAL);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = status.total > 0 ? Math.round(((status.sent + status.failed) / status.total) * 100) : 100;
  const allProcessed = status.done;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/announcements" className="text-navy/50 hover:text-navy font-body text-sm">← Announcements</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">New Announcement</h1>
      </div>

      <div className="bg-white border border-cream-dark rounded-xl p-8">
        <div className="text-center mb-6">
          {allProcessed ? (
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gold-dark animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <h2 className="font-heading text-xl text-navy font-bold mb-1">
            {allProcessed ? "SMS Delivered!" : "Sending SMS…"}
          </h2>
          <p className="text-sm text-navy/60 font-body">
            {allProcessed
              ? `Announcement published and SMS sent.`
              : `Sending in batches of 10. This may take a moment…`}
          </p>
        </div>

        {/* Progress bar */}
        {status.total > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs font-body text-navy/50 mb-1.5">
              <span>{status.sent + status.failed} of {status.total} processed</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 bg-cream-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-navy rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center bg-cream-light rounded-xl py-4">
            <p className="font-heading text-2xl font-bold text-navy">{status.total}</p>
            <p className="text-xs text-navy/50 font-body mt-0.5">Total</p>
          </div>
          <div className="text-center bg-green-50 rounded-xl py-4">
            <p className="font-heading text-2xl font-bold text-green-700">{status.sent}</p>
            <p className="text-xs text-green-600 font-body mt-0.5">Delivered</p>
          </div>
          <div className={`text-center rounded-xl py-4 ${status.failed > 0 ? "bg-red-50" : "bg-cream-light"}`}>
            <p className={`font-heading text-2xl font-bold ${status.failed > 0 ? "text-red-600" : "text-navy/30"}`}>
              {status.failed}
            </p>
            <p className={`text-xs font-body mt-0.5 ${status.failed > 0 ? "text-red-500" : "text-navy/30"}`}>Failed</p>
          </div>
        </div>

        {!allProcessed && (
          <p className="text-center text-xs text-navy/40 font-body">
            Failed batches are retried up to 2 more times automatically.
          </p>
        )}

        {allProcessed && (
          <div className="flex justify-center gap-3 mt-2">
            <Link
              href="/admin/announcements"
              className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-5 py-2.5 rounded-lg hover:bg-navy-light transition-colors"
            >
              View All Announcements
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewAnnouncementPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", isUrgent: false });

  // Progress view state — set after successful POST
  const [progressId, setProgressId] = useState<string | null>(null);
  const [progressTotal, setProgressTotal] = useState(0);

  const bodyLen = form.body.length;
  const bodyOver = bodyLen > MAX_CHARS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bodyOver) { toast.error("Message exceeds 160 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Failed to create"); return; }
      const data = await res.json();
      toast.success("Announcement published!");
      // Switch to progress view
      setProgressId(data.id);
      setProgressTotal(data.total);
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  }

  // Show progress view after announcement is created
  if (progressId !== null) {
    return <SmsProgressView id={progressId} total={progressTotal} />;
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
          <Input
            label="Title *"
            placeholder="Announcement title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />

          {/* Message with character counter */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-navy font-body">Message *</label>
              <span className={`text-xs font-body tabular-nums ${bodyOver ? "text-red-600 font-semibold" : bodyLen > 130 ? "text-amber-600" : "text-navy/40"}`}>
                {bodyLen} / {MAX_CHARS}
              </span>
            </div>
            <textarea
              rows={4}
              required
              maxLength={MAX_CHARS}
              placeholder="Write the announcement message… (max 160 characters — one SMS)"
              className={`rounded-md border bg-white px-3 py-2 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 resize-none transition-colors ${
                bodyOver
                  ? "border-red-400 focus:ring-red-400"
                  : "border-cream-dark focus:ring-navy"
              }`}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
            {bodyOver && (
              <p className="text-xs text-red-600 font-body">Message is too long — trim to 160 characters to fit in one SMS.</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isUrgent}
              onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))}
              className="w-4 h-4 rounded accent-burgundy"
            />
            <div>
              <span className="text-sm font-body font-medium text-navy">Mark as Urgent</span>
              <p className="text-xs text-navy/50 font-body">Urgent announcements are highlighted prominently.</p>
            </div>
          </label>
        </div>

        <p className="text-xs text-navy/50 font-body">
          📱 SMS will be sent to all active members in batches of 10, with automatic retries for any failures.
        </p>

        <Button type="submit" loading={loading} size="lg" disabled={bodyOver}>
          Publish Announcement
        </Button>
      </form>
    </div>
  );
}
