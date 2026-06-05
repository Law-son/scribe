"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { format, formatDistanceToNow } from "date-fns";

interface ReferredUser {
  id: string;
  name: string;
  membershipType: string;
  totalPoints: number;
  lastLoginAt: string | null;
  isActive: boolean;
  activityCount: number;
  recentlyActive: boolean;
  joinedAt: string;
}

interface RegisteredConvert {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
}

const convertStatusColor: Record<string, "gold" | "green" | "burgundy"> = {
  pending: "gold",
  verified: "green",
  rejected: "burgundy",
};

export default function EvangelismPage() {
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [registeredConverts, setRegisteredConverts] = useState<RegisteredConvert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evangelism/my-converts")
      .then((r) => r.json())
      .then((data) => {
        setReferredUsers(data.referredUsers ?? []);
        setRegisteredConverts(data.registeredConverts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalVerified = registeredConverts.filter((c) => c.status === "verified").length;
  const activePlatformMembers = referredUsers.filter((u) => u.recentlyActive).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-navy font-bold">My Evangelism</h1>
        <p className="text-navy/60 font-body mt-1">
          Track the souls you&apos;ve reached and their growth on the platform.
        </p>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-navy px-5 py-4 text-center">
            <p className="font-heading text-3xl font-bold text-gold">
              {referredUsers.length + registeredConverts.filter((c) => c.status === "verified").length}
            </p>
            <p className="text-cream/50 text-xs font-body mt-1">Total Souls Won</p>
          </div>
          <div className="rounded-2xl bg-forest/10 border border-forest/20 px-5 py-4 text-center">
            <p className="font-heading text-3xl font-bold text-forest">{activePlatformMembers}</p>
            <p className="text-navy/50 text-xs font-body mt-1">Active on Platform</p>
          </div>
          <div className="rounded-2xl bg-gold/10 border border-gold/20 px-5 py-4 text-center">
            <p className="font-heading text-3xl font-bold text-gold-dark">{totalVerified}</p>
            <p className="text-navy/50 text-xs font-body mt-1">Verified Converts</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center py-16 text-navy/40 font-body">Loading your evangelism data…</p>
      ) : (
        <>
          {/* Platform members referred */}
          <section>
            <h2 className="font-heading text-xl text-navy font-semibold mb-1">
              Referred Platform Members
            </h2>
            <p className="text-navy/50 font-body text-sm mb-4">
              Members who selected you as their referrer during registration.
            </p>

            {referredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cream-dark p-8 text-center">
                <p className="text-navy/40 font-body text-sm">
                  No platform members have listed you as their referrer yet.
                </p>
                <p className="text-navy/30 font-body text-xs mt-1">
                  When someone registers and selects your name, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white border border-cream-dark rounded-xl p-4 hover:border-navy/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar initial */}
                        <div className="w-10 h-10 rounded-full bg-navy/8 flex items-center justify-center flex-shrink-0">
                          <span className="font-heading text-sm font-bold text-navy">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-semibold text-navy text-sm truncate">{u.name}</p>
                          <p className="text-xs text-navy/40 font-body capitalize">
                            {u.membershipType} · Joined {format(new Date(u.joinedAt), "MMM yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="font-heading text-sm font-bold text-gold">{u.totalPoints.toLocaleString()} pts</p>
                          <p className="text-[10px] text-navy/30 font-body">{u.activityCount} actions</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.recentlyActive ? "bg-forest" : "bg-navy/20"}`} title={u.recentlyActive ? "Active in last 30 days" : "Inactive"} />
                      </div>
                    </div>

                    {u.lastLoginAt && (
                      <p className="text-[10px] text-navy/30 font-body mt-2 pl-13">
                        Last seen {formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Manually registered converts */}
          <section>
            <h2 className="font-heading text-xl text-navy font-semibold mb-1">
              Registered Converts
            </h2>
            <p className="text-navy/50 font-body text-sm mb-4">
              Converts you registered directly — awaiting or verified by admin.
            </p>

            {registeredConverts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cream-dark p-8 text-center">
                <p className="text-navy/40 font-body text-sm">No converts registered yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registeredConverts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-cream-dark rounded-xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-sm font-bold text-gold-dark">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-navy text-sm truncate">{c.name}</p>
                        <p className="text-xs text-navy/40 font-body">
                          {c.phone ?? "No phone"} · {format(new Date(c.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={convertStatusColor[c.status] ?? "gray"}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
