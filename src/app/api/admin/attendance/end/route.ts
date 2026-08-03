import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AttendanceSession from "@/models/AttendanceSession";
import { getCurrentUser } from "@/lib/auth";
import { getActiveSession } from "@/lib/attendance";
import { logActivity } from "@/lib/logActivity";

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function POST() {
  const actor = await guard();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const active = await getActiveSession();
  if (!active) return NextResponse.json({ error: "No active attendance session" }, { status: 400 });

  await AttendanceSession.updateOne(
    { _id: active._id },
    { $set: { isActive: false, endedAt: new Date() } }
  );

  logActivity({
    actorId: actor.sub,
    actorName: actor.name,
    action: "Ended attendance session",
    targetType: "attendanceSession",
    targetId: active._id.toString(),
  });

  return NextResponse.json({ ok: true });
}
