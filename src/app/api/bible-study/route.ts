import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import BibleStudy from "@/models/BibleStudy";
import { broadcastToAllMembers, SMS_TEMPLATES } from "@/lib/sms";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  date: z.string(),
  content: z.object({}).passthrough(),
  category: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
  const search = searchParams.get("search") ?? "";
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { status: "published" };
  if (search) query.$text = { $search: search };

  const [data, total] = await Promise.all([
    BibleStudy.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).select("-content -likes").lean(),
    BibleStudy.countDocuments(query),
  ]);

  return NextResponse.json({
    data: data.map((b) => ({ ...b, id: b._id.toString(), _id: undefined })),
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
  const doc = await BibleStudy.create({
    ...data,
    authorId: userId,
    publishedAt: data.status === "published" ? new Date() : undefined,
  });

  if (data.status === "published") {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/bible-study/${doc._id}`;
    Promise.resolve().then(() => broadcastToAllMembers(SMS_TEMPLATES.bibleStudy(url)));
  }

  return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
}
