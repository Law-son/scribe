import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import AttendanceRecord from "@/models/AttendanceRecord";
import { getActiveSession, dayString } from "@/lib/attendance";
import { haversineDistance, isWithinGeofence } from "@/lib/geo";
import { awardPoints } from "@/lib/points";

const Schema = z.object({
  sessionId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();

  // Re-validate against whatever session is *currently* active — closes the
  // gap between the member's earlier status check and this tap (the old
  // session may have ended and a new one started in between).
  const session = await getActiveSession();
  if (!session || session._id.toString() !== parsed.data.sessionId) {
    return NextResponse.json(
      { error: "This attendance session is no longer active. Please refresh and try again." },
      { status: 400 }
    );
  }

  const distanceMeters = haversineDistance(
    session.latitude,
    session.longitude,
    parsed.data.latitude,
    parsed.data.longitude
  );

  if (!isWithinGeofence(distanceMeters, parsed.data.accuracy, session.radiusMeters)) {
    return NextResponse.json(
      { error: "You're too far from the church to check in. Move closer and try again." },
      { status: 400 }
    );
  }

  const user = await User.findById(userId).select("name phone").lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    await AttendanceRecord.create({
      sessionId: session._id,
      userId,
      userName: user.name,
      userPhone: user.phone,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracyMeters: parsed.data.accuracy,
      distanceMeters,
      day: dayString(),
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json({ error: "You've already checked in for this attendance." }, { status: 409 });
    }
    throw err;
  }

  // If the attendance record succeeded but the point award somehow fails,
  // still report check-in success (points omitted) — an error here would
  // make a re-tap surface a confusing "already checked in" and read as broken.
  const awarded = await awardPoints({
    userId,
    action: "mark_attendance",
    contentId: session._id.toString(),
  }).catch(() => false);

  return NextResponse.json({ ok: true, pointsAwarded: awarded ? 5 : 0 });
}
