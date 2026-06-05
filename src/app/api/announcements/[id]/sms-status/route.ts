import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const doc = await Announcement.findById(id)
    .select("smsTotal smsSent smsFailed smsDone")
    .lean();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    total: doc.smsTotal ?? 0,
    sent: doc.smsSent ?? 0,
    failed: doc.smsFailed ?? 0,
    done: doc.smsDone ?? false,
  });
}
