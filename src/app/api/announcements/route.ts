import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";
import { broadcastToAllMembers, SMS_TEMPLATES } from "@/lib/sms";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  isUrgent: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  await connectDB();
  const now = new Date();

  const data = await Announcement.find({
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  })
    .sort({ isUrgent: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    data: data.map((a) => ({ ...a, id: a._id.toString(), _id: undefined })),
  });
}

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const userId = headersList.get("x-user-id");
  if (role !== "admin" || !userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const doc = await Announcement.create({ ...parsed.data, authorId: userId });

  // Send SMS for urgent announcements or all announcements (fire-and-forget)
  Promise.resolve().then(async () => {
    await broadcastToAllMembers(SMS_TEMPLATES.announcement(doc.title, doc.body));
    await Announcement.findByIdAndUpdate(doc._id, { smsTriggered: true, smsSentAt: new Date() });
  });

  return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
}
