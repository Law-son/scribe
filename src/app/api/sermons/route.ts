import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import { broadcastToAllMembers, SMS_TEMPLATES } from "@/lib/sms";
import { logActivity } from "@/lib/logActivity";

const CreateSermonSchema = z.object({
  title: z.string().min(1).max(200),
  preacher: z.string().min(1).max(100),
  date: z.string(),
  content: z.object({}).passthrough(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));
  const search = searchParams.get("search") ?? "";
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { status: "published" };
  if (search) {
    query.$text = { $search: search };
  }

  const [data, total] = await Promise.all([
    Sermon.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-content -likes")
      .lean(),
    Sermon.countDocuments(query),
  ]);

  return NextResponse.json({
    data: data.map((s) => ({ ...s, id: s._id.toString(), _id: undefined })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const userId = headersList.get("x-user-id");

  if (role !== "admin" || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateSermonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await connectDB();

  const data = parsed.data;
  const sermon = await Sermon.create({
    ...data,
    authorId: userId,
    publishedAt: data.status === "published" ? new Date() : undefined,
  });

  const actorName = headersList.get("x-user-name") ?? "Admin";
  logActivity({
    actorId: userId,
    actorName,
    action: data.status === "published" ? `Published sermon: ${sermon.title}` : `Created sermon draft: ${sermon.title}`,
    targetType: "sermon",
    targetId: sermon._id.toString(),
    targetLabel: sermon.title,
  });

  if (data.status === "published") {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/sermons/${sermon._id}`;
    Promise.resolve().then(() =>
      broadcastToAllMembers(SMS_TEMPLATES.sermon(sermon.title, url))
    );
  }

  return NextResponse.json(
    { id: sermon._id.toString(), ...sermon.toObject() },
    { status: 201 }
  );
}
