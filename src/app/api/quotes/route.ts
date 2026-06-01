import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Quote from "@/models/Quote";
import { broadcastToAllMembers, SMS_TEMPLATES } from "@/lib/sms";

const CreateSchema = z.object({
  text: z.string().min(1).max(1000),
  author: z.string().min(1).max(100),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "12"));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Quote.find({ status: "published" }).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-likes").lean(),
    Quote.countDocuments({ status: "published" }),
  ]);

  return NextResponse.json({
    data: data.map((q) => ({ ...q, id: q._id.toString(), _id: undefined })),
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
  const doc = await Quote.create({ ...parsed.data, authorId: userId });

  if (parsed.data.status === "published") {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/quotes`;
    Promise.resolve().then(() =>
      broadcastToAllMembers(SMS_TEMPLATES.quote(doc.text, doc.author, url))
    );
  }

  return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
}
