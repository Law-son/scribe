"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { MAX_ACCEPTABLE_ACCURACY_METERS } from "@/lib/geo";

type LocationPermission = "checking" | "granted" | "prompt" | "denied" | "unsupported";

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
  const [locationPermission, setLocationPermission] = useState<LocationPermission>("checking");
  // Most recent fix we've obtained, from priming or a prior check-in attempt —
  // reused as a maximumAge cache buster and as a last-resort fallback so a
  // slow GPS lock doesn't have to happen from scratch on every tap.
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

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

  // Shared by the on-load priming effect and the manual "Enable location"
  // retry button — a real click gives this a fresh user gesture, which is
  // the most reliable way to get some browsers (notably iOS Safari) to
  // re-show a permission prompt that was silently dismissed.
  const requestLocationPermission = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastPositionRef.current = position;
        setLocationPermission("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationPermission("denied");
        } else {
          // Timed out / unavailable without an explicit deny — most likely
          // the user dismissed the native prompt, or (some iOS Safari
          // versions) the prompt never appeared for an unattended call.
          // Treat as "still needs the user to grant it" rather than fail
          // silently, so the retry banner shows.
          setLocationPermission("prompt");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  // Confirm location access the moment the member lands on the page, rather
  // than waiting for the "Take Attendance" tap — surfaces the permission
  // prompt (or a denied/prompt banner) immediately, and warms up a cached
  // fix so the actual check-in doesn't have to wait on a fresh GPS lock.
  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      queueMicrotask(() => {
        if (!cancelled) setLocationPermission("unsupported");
      });
      return () => {
        cancelled = true;
      };
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permStatus) => {
          if (cancelled) return;
          setLocationPermission(permStatus.state as LocationPermission);
          if (permStatus.state !== "denied") requestLocationPermission();
          permStatus.onchange = () => {
            if (cancelled) return;
            setLocationPermission(permStatus.state as LocationPermission);
            if (permStatus.state === "granted") requestLocationPermission();
          };
        })
        .catch(() => {
          // Permissions API present but the geolocation query isn't
          // supported (some older iOS Safari versions) — just ask directly.
          if (!cancelled) requestLocationPermission();
        });
    } else {
      // No Permissions API at all — the only way to find out is to ask.
      requestLocationPermission();
    }

    return () => {
      cancelled = true;
    };
  }, [requestLocationPermission]);

  function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  // Some Android devices' GPS never settles for a high-accuracy
  // getCurrentPosition call and just times out, even though location
  // services are on — but watchPosition on the same device resolves fine.
  // Fall back to it (network/coarse location) before giving up. A hard
  // ceiling guards against watchPosition itself stalling silently (some
  // Android WebViews never fire either callback), which would otherwise
  // leave the button spinning forever.
  function watchPositionOnce(options: PositionOptions, hardTimeoutMs: number): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (settled) return;
          settled = true;
          navigator.geolocation.clearWatch(watchId);
          resolve(pos);
        },
        (err) => {
          if (settled) return;
          settled = true;
          navigator.geolocation.clearWatch(watchId);
          reject(err);
        },
        options
      );
      setTimeout(() => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(watchId);
        reject(new Error("watchPosition hard timeout"));
      }, hardTimeoutMs);
    });
  }

  // Reuse a recent fix as a last resort so a device that keeps timing out
  // isn't a dead end — but "recent" is tight (60s, matching the maximumAge
  // used for the live attempt) since the geofence radius is only ~100m and a
  // stale fix is exactly wrong for someone who just arrived or just left.
  const STALE_POSITION_MAX_AGE_MS = 60_000;

  async function resolvePosition(): Promise<{ position: GeolocationPosition; stale: boolean }> {
    try {
      const position = await getPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
      lastPositionRef.current = position;
      return { position, stale: false };
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr.code === geoErr.PERMISSION_DENIED) throw geoErr;

      try {
        const position = await watchPositionOnce({ enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }, 22000);
        lastPositionRef.current = position;
        return { position, stale: false };
      } catch (fallbackErr) {
        if (lastPositionRef.current && Date.now() - lastPositionRef.current.timestamp < STALE_POSITION_MAX_AGE_MS) {
          return { position: lastPositionRef.current, stale: true };
        }
        throw fallbackErr;
      }
    }
  }

  async function handleTakeAttendance() {
    if (!status?.session) return;
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location services.");
      return;
    }
    if (locationPermission === "denied") {
      toast.error("Location permission denied. Enable it in your browser settings, then reload this page.");
      return;
    }

    setCheckingIn(true);
    try {
      const { position, stale } = await resolvePosition();

      if (position.coords.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
        toast.error("Couldn't get a precise enough location. Move outdoors or near a window and try again.");
        return;
      }

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: status.session.id,
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
      toast.success(
        `Attendance marked! +${data.pointsAwarded} points ✅${stale ? " (using your last known location)" : ""}`
      );
      router.refresh();
      loadData();
    } catch (err) {
      const geoErr = err as Partial<GeolocationPositionError>;
      if (geoErr?.code === 1) {
        setLocationPermission("denied");
        toast.error("Location permission denied. Enable it and try again.");
      } else if (geoErr?.code === 3) {
        toast.error("Location request timed out. Move to an open area or near a window and try again.");
      } else if (geoErr?.code === 2) {
        toast.error("Couldn't determine your location. Make sure Location Services are turned on.");
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setCheckingIn(false);
    }
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

      {locationPermission === "denied" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-center">
          <p className="text-sm text-red-700 font-body font-medium mb-1">Location access is blocked</p>
          <p className="text-sm text-red-600/80 font-body">
            Check-in needs your location to confirm you&apos;re at church. Enable location for this site in your
            browser&apos;s settings, then reload the page.
          </p>
        </div>
      )}
      {locationPermission === "prompt" && (
        <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5 mb-6 text-center">
          <p className="text-sm text-navy font-body font-medium mb-3">
            Check-in needs your location. Tap below to allow it.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={requestLocationPermission}>
            Enable Location
          </Button>
        </div>
      )}
      {locationPermission === "unsupported" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-center">
          <p className="text-sm text-red-700 font-body font-medium">Your browser doesn&apos;t support location services, so check-in isn&apos;t available here.</p>
        </div>
      )}

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
            <Button
              type="button"
              onClick={handleTakeAttendance}
              loading={checkingIn}
              disabled={locationPermission === "denied" || locationPermission === "unsupported"}
              size="lg"
            >
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
