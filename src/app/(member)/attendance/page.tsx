"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface StatusResponse {
  session: { id: string; label: string | null; startedAt: string } | null;
  checkedIn: boolean;
}

interface HistoryRecord {
  id: string;
  day: string;
  checkedInAt: string;
}

interface HistoryResponse {
  stats: { month: number; year: number; allTime: number };
  records: HistoryRecord[];
}

export default function AttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/attendance/status").then((r) => r.json()),
      fetch("/api/attendance/history").then((r) => r.json()),
    ])
      .then(([statusData, historyData]) => {
        setStatus(statusData);
        setHistory(historyData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleTakeAttendance() {
    if (!status?.session) return;
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location services.");
      return;
    }

    setCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/attendance/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: status.session!.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error ?? "Check-in failed");
            return;
          }
          toast.success(`Attendance marked! +${data.pointsAwarded} points ✅`);
          router.refresh();
          loadData();
        } catch {
          toast.error("Network error. Please try again.");
        } finally {
          setCheckingIn(false);
        }
      },
      (err) => {
        setCheckingIn(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable it and try again.");
        } else if (err.code === err.TIMEOUT) {
          toast.error("Location request timed out. Please try again.");
        } else {
          toast.error("Couldn't determine your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cream-dark rounded w-48" />
          <div className="h-40 bg-cream-dark rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Attendance</h1>
        <p className="text-navy/60 font-body mt-1">Check in when you&apos;re at church. Earn +5 points each time.</p>
      </div>

      {/* Status card */}
      <div className="bg-white border border-cream-dark rounded-2xl p-7 mb-8 text-center">
        {!status?.session ? (
          <>
            <div className="w-14 h-14 rounded-full bg-cream-light flex items-center justify-center mx-auto mb-4 text-2xl">📍</div>
            <h2 className="font-heading text-lg text-navy font-semibold mb-1">No attendance available right now</h2>
            <p className="text-sm text-navy/50 font-body">Check back once an admin starts attendance for a service.</p>
          </>
        ) : status.checkedIn ? (
          <>
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-heading text-lg text-navy font-semibold mb-1">You&apos;re checked in! ✅</h2>
            <p className="text-sm text-navy/50 font-body">Attendance recorded for this session.</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 text-2xl">📍</div>
            <h2 className="font-heading text-lg text-navy font-semibold mb-1">Attendance is open</h2>
            <p className="text-sm text-navy/50 font-body mb-5">Tap below while you&apos;re at church to check in.</p>
            <Button type="button" onClick={handleTakeAttendance} loading={checkingIn} size="lg">
              Take Attendance
            </Button>
          </>
        )}
      </div>

      {/* Personal stats */}
      {history && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center bg-cream-light rounded-xl py-4">
              <p className="font-heading text-2xl font-bold text-navy">{history.stats.month}</p>
              <p className="text-xs text-navy/50 font-body mt-0.5">This Month</p>
            </div>
            <div className="text-center bg-cream-light rounded-xl py-4">
              <p className="font-heading text-2xl font-bold text-navy">{history.stats.year}</p>
              <p className="text-xs text-navy/50 font-body mt-0.5">This Year</p>
            </div>
            <div className="text-center bg-cream-light rounded-xl py-4">
              <p className="font-heading text-2xl font-bold text-navy">{history.stats.allTime}</p>
              <p className="text-xs text-navy/50 font-body mt-0.5">All Time</p>
            </div>
          </div>

          <h2 className="font-heading text-lg text-navy font-semibold mb-4">My Records</h2>
          {history.records.length === 0 ? (
            <p className="text-navy/40 font-body text-sm">No attendance recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {history.records.map((r) => (
                <div key={r.id} className="bg-white border border-cream-dark rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="font-body text-sm text-navy">{format(new Date(r.checkedInAt), "EEEE, MMM d, yyyy")}</p>
                  <p className="text-xs text-navy/40 font-body">{format(new Date(r.checkedInAt), "h:mm a")}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
