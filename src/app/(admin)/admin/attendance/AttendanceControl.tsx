"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { SerializedSession } from "@/lib/attendance";

const POLL_INTERVAL = 3000;
const DEFAULT_RADIUS = 100;

interface Props {
  initialSession: SerializedSession | null;
  initialCount: number;
}

export function AttendanceControl({ initialSession, initialCount }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SerializedSession | null>(initialSession);
  const [count, setCount] = useState(initialCount);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [radius, setRadius] = useState(String(DEFAULT_RADIUS));
  const [label, setLabel] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Plain ref, not state — lets poll() detect "the session just disappeared"
  // without nesting side effects (toast/router.refresh) inside a setState
  // updater, which React disallows while another component is rendering.
  const hadSessionRef = useRef(initialSession !== null);

  const hasSession = session !== null;

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/attendance/status");
      if (!res.ok) return;
      const data: { session: SerializedSession | null; count: number } = await res.json();
      setCount(data.count);
      setSession(data.session);
      if (!data.session && hadSessionRef.current) {
        toast("Attendance session is no longer active.");
        router.refresh();
      }
      hadSessionRef.current = data.session !== null;
    } catch {
      // network glitch — keep polling
    }
  }, [router]);

  useEffect(() => {
    if (!hasSession) return;
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  function handleStart() {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location services.");
      return;
    }
    setStarting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/admin/attendance/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              radiusMeters: Number(radius) || DEFAULT_RADIUS,
              label: label.trim() || undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error ?? "Failed to start attendance");
            return;
          }
          setSession(data.session);
          setCount(data.selfCheckedIn ? 1 : 0);
          hadSessionRef.current = data.session !== null;
          if (data.alreadyActive) {
            toast.success("An attendance session is already active.");
          } else if (data.selfCheckedIn) {
            toast.success("Attendance started! You've been marked present. +5 points 📍");
          } else {
            toast.success("Attendance started!");
          }
          router.refresh();
        } catch {
          toast.error("Network error. Please try again.");
        } finally {
          setStarting(false);
        }
      },
      () => {
        setStarting(false);
        toast.error("Couldn't get your location. Please enable location services and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleEnd() {
    setEnding(true);
    try {
      const res = await fetch("/api/admin/attendance/end", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to end attendance");
        return;
      }
      setSession(null);
      hadSessionRef.current = false;
      toast.success("Attendance ended.");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setEnding(false);
    }
  }

  if (!session) {
    return (
      <div className="bg-white border border-cream-dark rounded-xl p-6">
        <h2 className="font-heading text-lg text-navy font-semibold mb-1">Start Attendance</h2>
        <p className="text-sm text-navy/60 font-body mb-5">
          Your current location becomes the confined area members must be in to check in.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-5 max-w-lg">
          <Input
            label="Confinement Radius (meters)"
            type="number"
            min={10}
            max={2000}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
          <Input
            label="Label (optional)"
            placeholder="e.g. Sunday Service"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <Button type="button" onClick={handleStart} loading={starting} size="lg">
          Start Attendance
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-cream-dark rounded-xl p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-lg text-navy font-semibold">
            {session.label || "Attendance"} is open
          </h2>
          <p className="text-sm text-navy/50 font-body">
            Started {format(new Date(session.startedAt), "h:mm a")} — radius {session.radiusMeters}m
          </p>
        </div>
        <Button type="button" variant="danger" onClick={handleEnd} loading={ending}>
          End Attendance
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center bg-cream-light rounded-xl py-4">
          <p className="font-heading text-2xl font-bold text-navy tabular-nums">{count}</p>
          <p className="text-xs text-navy/50 font-body mt-0.5">Checked In</p>
        </div>
        <div className="text-center bg-green-50 rounded-xl py-4 col-span-2 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <p className="text-sm text-green-700 font-body font-medium">Live — updating every few seconds</p>
        </div>
      </div>
    </div>
  );
}
