import { NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import AttendanceRecord from "@/models/AttendanceRecord";
import { dayString } from "@/lib/attendance";

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const today = dayString();
  const monthPrefix = today.slice(0, 7); // YYYY-MM
  const yearPrefix = today.slice(0, 4); // YYYY

  const [records, monthCount, yearCount, allTimeCount] = await Promise.all([
    AttendanceRecord.find({ userId }).sort({ checkedInAt: -1 }).limit(50).lean(),
    AttendanceRecord.countDocuments({ userId, day: { $regex: `^${monthPrefix}` } }),
    AttendanceRecord.countDocuments({ userId, day: { $regex: `^${yearPrefix}` } }),
    AttendanceRecord.countDocuments({ userId }),
  ]);

  return NextResponse.json({
    stats: { month: monthCount, year: yearCount, allTime: allTimeCount },
    records: records.map((r) => ({
      id: r._id.toString(),
      day: r.day,
      checkedInAt: r.checkedInAt,
    })),
  });
}
