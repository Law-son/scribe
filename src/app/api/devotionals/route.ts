import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";

const CreateSchema = z.object({
  topic: z.string().min(1).max(200),
  dayNumber: z.number().int().positive().optional(),
  weekNumber: z.string().optional(),
  weekTheme: z.string().optional(),
  verse: z.string().optional(),
  verseText: z.string().optional(),
  verseTranslation: z.string().optional(),
  content: z.object({}).passthrough(),
});

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
  const skip = (page - 1) * limit;
  const now = new Date();

  const query = { status: "approved" as const, scheduledAt: { $lte: now } };

  const [data, total] = await Promise.all([
    Devotional.find(query).sort({ dayNumber: -1 }).skip(skip).limit(limit).select("-content -likes").lean(),
    Devotional.countDocuments(query),
  ]);

  return NextResponse.json({
    data: data.map((d) => ({ ...d, id: d._id.toString(), _id: undefined })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
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

  const data = parsed.data;
  const totalExisting = await Devotional.countDocuments();
  const dayNumber = data.dayNumber ?? totalExisting + 1;
  const weekNumber = data.weekNumber ?? String(Math.ceil(dayNumber / 7)).padStart(2, "0");

  const doc = await Devotional.create({
    ...data,
    dayNumber,
    weekNumber,
    title: data.topic, // keep title in sync for legacy reads
    scheduledAt: new Date(),
    authorId: userId,
    status: "pending",
  });

  return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
}
