import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import { broadcastToAllMembers, SMS_TEMPLATES } from "@/lib/sms";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const userId = headersList.get("x-user-id");
  if (role !== "admin" || !userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const doc = await Devotional.findByIdAndUpdate(
    id,
    { status: "approved" as const, approvedBy: userId, approvedAt: new Date() },
    { new: true }
  );
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only broadcast if scheduledAt is now or in the past
  if (doc.scheduledAt <= new Date()) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/devotionals/${id}`;
    Promise.resolve().then(() => broadcastToAllMembers(SMS_TEMPLATES.devotional(url)));
  }

  return NextResponse.json({ id: doc._id.toString(), status: doc.status });
}
