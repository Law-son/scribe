import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";
import { broadcastWithProgress, SMS_TEMPLATES } from "@/lib/sms";
import User from "@/models/User";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(160),
  isUrgent: z.boolean().default(false),
});

export async function GET() {
  await connectDB();

  const data = await Announcement.find()
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

  // Get all active members' phone numbers upfront so we know the total
  const users = await User.find({ isActive: true }).select("phone").lean();
  const numbers = users.map((u) => u.phone).filter(Boolean) as string[];

  const doc = await Announcement.create({
    ...parsed.data,
    authorId: userId,
    smsTriggered: true,
    smsTotal: numbers.length,
    smsSent: 0,
    smsFailed: 0,
    smsDone: numbers.length === 0, // done immediately if no members
  });

  const announcementId = doc._id.toString();
  const message = SMS_TEMPLATES.announcement(doc.title, doc.body);

  if (numbers.length > 0) {
    // Fire-and-forget background job — updates DB progress after every batch of 10
    Promise.resolve().then(async () => {
      try {
        await broadcastWithProgress(numbers, message, async (sent, failed) => {
          await Announcement.findByIdAndUpdate(announcementId, {
            smsSent: sent,
            smsFailed: failed,
          });
        });
        await Announcement.findByIdAndUpdate(announcementId, {
          smsDone: true,
          smsSentAt: new Date(),
        });
      } catch (err) {
        console.error("[SMS] Announcement broadcast failed:", err);
        await Announcement.findByIdAndUpdate(announcementId, { smsDone: true });
      }
    });
  }

  return NextResponse.json(
    { id: announcementId, total: numbers.length },
    { status: 201 }
  );
}
