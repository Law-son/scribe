"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";

interface Convert { id: string; name: string; phone?: string; status: string; createdAt: string; }

export default function EvangelismPage() {
  const [converts, setConverts] = useState<Convert[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [loaded, setLoaded] = useState(false);

  async function loadMyConverts() {
    if (loaded) return;
    setLoading(true);
    const res = await fetch("/api/evangelism");
    const data = await res.json();
    setConverts(data.data ?? []);
    setLoaded(true);
    setLoading(false);
  }

  // Load on mount
  useState(() => { loadMyConverts(); });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/evangelism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Failed to register"); return; }
      const { id } = await res.json();
      toast.success("Convert registered! Awaiting admin verification.");
      setConverts((prev) => [{ id, name: form.name, phone: form.phone, status: "pending", createdAt: new Date().toISOString() }, ...prev]);
      setForm({ name: "", phone: "", address: "", notes: "" });
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const statusColors: Record<string, "gold" | "green" | "burgundy"> = {
    pending: "gold",
    verified: "green",
    rejected: "burgundy",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Evangelism</h1>
        <p className="text-navy/60 font-body mt-1">
          Register souls you&apos;ve led to Christ. Earn +15 points upon admin verification.
        </p>
      </div>

      {/* Register form */}
      <div className="bg-white border border-cream-dark rounded-2xl p-7 mb-8">
        <h2 className="font-heading text-xl text-navy font-semibold mb-5">Register a New Convert</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full Name *" placeholder="Convert's full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Phone Number" placeholder="+233…" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Address / Location" placeholder="Where they live" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy font-body">Notes</label>
            <textarea
              rows={3}
              placeholder="Any additional context…"
              className="rounded-md border border-cream-dark bg-white px-3 py-2 text-sm font-body text-navy-dark focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button type="submit" loading={submitting} disabled={!form.name.trim()}>
            Register Convert 🌱
          </Button>
        </form>
      </div>

      {/* My converts */}
      <h2 className="font-heading text-xl text-navy font-semibold mb-4">My Registered Converts</h2>
      {loading ? (
        <p className="text-navy/50 font-body">Loading…</p>
      ) : converts.length === 0 ? (
        <p className="text-navy/40 font-body text-sm">You haven&apos;t registered any converts yet.</p>
      ) : (
        <div className="space-y-3">
          {converts.map((c) => (
            <div key={c.id} className="bg-white border border-cream-dark rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-body font-medium text-navy">{c.name}</p>
                {c.phone && <p className="text-xs text-navy/50 font-body">{c.phone}</p>}
              </div>
              <Badge variant={statusColors[c.status] ?? "gray"}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
