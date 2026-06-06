"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface ManualConvert {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

interface PlatformConvert {
  id: string;
  name: string;
  phone: string | null;
  lastLoginAt: string | null;
  totalPoints: number;
  joinedAt: string;
}

export default function EvangelismPage() {
  const [manualConverts, setManualConverts] = useState<ManualConvert[]>([]);
  const [platformConverts, setPlatformConverts] = useState<PlatformConvert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });

  useEffect(() => {
    fetch("/api/evangelism")
      .then((r) => r.json())
      .then((data) => {
        setManualConverts(data.manualConverts ?? []);
        setPlatformConverts(data.platformConverts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

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
      if (!res.ok) { toast.error("Failed to register convert"); return; }
      const { id } = await res.json();
      toast.success("Convert registered! +15 points awarded 🌱");
      setManualConverts((prev) => [{ id, name: form.name, phone: form.phone || null, address: form.address || null, createdAt: new Date().toISOString() }, ...prev]);
      setForm({ name: "", phone: "", address: "", notes: "" });
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const total = manualConverts.length + platformConverts.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Evangelism</h1>
        <p className="text-navy/60 font-body mt-1">
          Register souls you&apos;ve led to Christ. Earn +15 points for each convert.
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

      {/* Converts list */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl text-navy font-semibold">My Converts</h2>
        {total > 0 && <span className="text-sm font-body text-navy/50">{total} total</span>}
      </div>

      {loading ? (
        <p className="text-navy/50 font-body text-sm">Loading…</p>
      ) : total === 0 ? (
        <p className="text-navy/40 font-body text-sm">You haven&apos;t registered any converts yet.</p>
      ) : (
        <div className="space-y-8">

          {/* Platform converts — joined via registration */}
          {platformConverts.length > 0 && (
            <section>
              <p className="text-xs font-body font-semibold text-navy/40 uppercase tracking-widest mb-3">
                Joined the Platform
              </p>
              <div className="space-y-3">
                {platformConverts.map((u) => (
                  <div key={u.id} className="bg-white border border-cream-dark rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-sm font-bold text-forest">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-medium text-navy truncate">{u.name}</p>
                        <p className="text-xs text-navy/40 font-body">
                          {u.lastLoginAt
                            ? `Last seen ${formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })}`
                            : `Joined ${format(new Date(u.joinedAt), "MMM d, yyyy")}`}
                        </p>
                      </div>
                    </div>
                    <p className="font-heading text-sm font-bold text-gold flex-shrink-0">
                      {u.totalPoints.toLocaleString()} pts
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Manual converts — registered via form */}
          {manualConverts.length > 0 && (
            <section>
              <p className="text-xs font-body font-semibold text-navy/40 uppercase tracking-widest mb-3">
                Registered by You
              </p>
              <div className="space-y-3">
                {manualConverts.map((c) => (
                  <div key={c.id} className="bg-white border border-cream-dark rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-sm font-bold text-gold-dark">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-medium text-navy truncate">{c.name}</p>
                        {c.phone && <p className="text-xs text-navy/40 font-body">{c.phone}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-navy/30 font-body flex-shrink-0">
                      {format(new Date(c.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
