import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AttendanceRecord from "@/models/AttendanceRecord";
import { getCurrentUser } from "@/lib/auth";
import { getActiveSession, serializeSession } from "@/lib/attendance";

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ session: null, count: 0 });

  const count = await AttendanceRecord.countDocuments({ sessionId: session._id });
  return NextResponse.json({ session: serializeSession(session), count });
}
