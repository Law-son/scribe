import connectDB from "./db";
import AttendanceSession from "@/models/AttendanceSession";
import AttendanceRecord from "@/models/AttendanceRecord";

export const AUTO_CLOSE_HOURS = 6;
export const DEFAULT_RADIUS_METERS = 100;

/**
 * Day string 'YYYY-MM-DD' for a given date (or now), in server-local time.
 * This is the one place it's computed, so the timezone convention is applied
 * consistently everywhere `day` strings are compared (week/month bucketing,
 * history queries). Deliberately local time, not UTC (unlike
 * PointTransaction's daily_login `day`) — so an evening service doesn't roll
 * into the next calendar day for a congregation not at UTC+0.
 */
export function dayString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Sunday-start "week of month" index (1-based) for a given date, using the
 * same local-time convention as dayString(). Ranges 4-6 depending on the
 * month — callers must build their chart axis dynamically, never assume a
 * fixed bucket count.
 */
export function weekOfMonth(date: Date): number {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday
  return Math.ceil((date.getDate() + firstWeekday) / 7);
}

/**
 * The single source of truth for "is there an active attendance session."
 * Lazily auto-closes any session left open past AUTO_CLOSE_HOURS — a safety
 * net for a forgotten "End Attendance," not a replacement for it. Every
 * route that touches session state must call this rather than querying
 * AttendanceSession directly, so the auto-close logic is never applied
 * inconsistently.
 *
 * endedAt is derived from startedAt (via an aggregation-pipeline update),
 * not the current request time, so the recorded end time is deterministic
 * regardless of which request happens to trigger the lazy close.
 */
export async function getActiveSession() {
  await connectDB();

  const cutoff = new Date(Date.now() - AUTO_CLOSE_HOURS * 60 * 60 * 1000);
  await AttendanceSession.updateMany(
    { isActive: true, startedAt: { $lt: cutoff } },
    [
      {
        $set: {
          isActive: false,
          autoClosed: true,
          endedAt: { $add: ["$startedAt", AUTO_CLOSE_HOURS * 60 * 60 * 1000] },
        },
      },
    ],
    { updatePipeline: true }
  );

  return AttendanceSession.findOne({ isActive: true }).lean();
}

export interface SerializedSession {
  id: string;
  startedAt: Date;
  radiusMeters: number;
  label: string | null;
  autoClosed: boolean;
}

/** Explicit {id, ...} shape for a session, for API/SSR responses — never hand a raw Mongoose doc to the client. */
export function serializeSession(session: {
  _id: { toString(): string };
  startedAt: Date;
  radiusMeters: number;
  label?: string;
  autoClosed: boolean;
}): SerializedSession {
  return {
    id: session._id.toString(),
    startedAt: session.startedAt,
    radiusMeters: session.radiusMeters,
    label: session.label ?? null,
    autoClosed: session.autoClosed,
  };
}

/**
 * Attendance records for a specific calendar day, optionally filtered by a
 * name/phone search — shared by the admin day-lookup page (SSR) and its
 * matching API route. Groups by session (a day can have more than one, e.g.
 * morning and evening service) plus a deduplicated daily total.
 */
export async function getDayRecords(date: string, search: string) {
  await connectDB();

  const query: Record<string, unknown> = { day: date };
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: "i" } },
      { userPhone: { $regex: search, $options: "i" } },
    ];
  }

  const records = await AttendanceRecord.find(query).sort({ checkedInAt: -1 }).lean();

  const bySession = new Map<string, number>();
  const uniqueUsers = new Set<string>();
  for (const r of records) {
    const key = r.sessionId.toString();
    bySession.set(key, (bySession.get(key) ?? 0) + 1);
    uniqueUsers.add(r.userId.toString());
  }

  return {
    date,
    total: uniqueUsers.size,
    sessions: Array.from(bySession.entries()).map(([sessionId, count]) => ({ sessionId, count })),
    records: records.map((r) => ({
      id: r._id.toString(),
      userId: r.userId.toString(),
      name: r.userName,
      phone: r.userPhone,
      checkedInAt: r.checkedInAt,
      sessionId: r.sessionId.toString(),
    })),
  };
}

/** Number of Sunday-start calendar weeks a given month spans (4-6). */
export function weeksInMonth(month: number, year: number): number {
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  return weekOfMonth(new Date(year, month - 1, lastDayOfMonth));
}

/**
 * Total check-ins per Sunday-start calendar week for a given month — shared
 * by the admin analytics page (SSR) and its matching API route. Always
 * returns every week bucket for the month (even if empty), never just the
 * weeks that happen to have data, so a chart's x-axis is stable.
 */
export async function getWeeklyBreakdown(month: number, year: number) {
  await connectDB();

  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const records = await AttendanceRecord.find({ day: { $regex: `^${prefix}` } })
    .select("day")
    .lean();

  const weekCounts = new Map<number, number>();
  for (const r of records) {
    const [y, m, d] = r.day.split("-").map(Number);
    const week = weekOfMonth(new Date(y, m - 1, d));
    weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1);
  }

  const totalWeeks = weeksInMonth(month, year);
  const buckets = [];
  for (let w = 1; w <= totalWeeks; w++) {
    buckets.push({ week: w, count: weekCounts.get(w) ?? 0 });
  }
  return buckets;
}
