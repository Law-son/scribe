import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import AttendanceSession from "@/models/AttendanceSession";
import { getCurrentUser } from "@/lib/auth";
import { getActiveSession, serializeSession, DEFAULT_RADIUS_METERS } from "@/lib/attendance";
import { logActivity } from "@/lib/logActivity";

const Schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).max(2000).optional(),
  label: z.string().max(100).optional(),
});

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const actor = await guard();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();

  // Lazily close anything stale before deciding whether one's already active.
  const existing = await getActiveSession();
  if (existing) {
    return NextResponse.json({ session: serializeSession(existing), alreadyActive: true });
  }

  try {
    const session = await AttendanceSession.create({
      startedBy: actor.sub,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      radiusMeters: parsed.data.radiusMeters ?? DEFAULT_RADIUS_METERS,
      label: parsed.data.label,
    });

    logActivity({
      actorId: actor.sub,
      actorName: actor.name,
      action: "Started attendance session",
      targetType: "attendanceSession",
      targetId: session._id.toString(),
    });

    return NextResponse.json({ session: serializeSession(session), alreadyActive: false });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      // Race: another request started one between our check and create.
      const active = await getActiveSession();
      return NextResponse.json({ session: active ? serializeSession(active) : null, alreadyActive: true });
    }
    throw err;
  }
}
