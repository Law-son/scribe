import { NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import AttendanceRecord from "@/models/AttendanceRecord";
import { getActiveSession } from "@/lib/attendance";

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ session: null, checkedIn: false });

  const existing = await AttendanceRecord.findOne({ sessionId: session._id, userId })
    .select("_id")
    .lean();

  return NextResponse.json({
    session: {
      id: session._id.toString(),
      label: session.label ?? null,
      startedAt: session.startedAt,
    },
    checkedIn: !!existing,
  });
}
