import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Comment from "@/models/Comment";
import User from "@/models/User";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const comments = await Comment.find({ contentType: "sermon", contentId: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("authorId", "name")
    .lean();

  return NextResponse.json({
    data: comments.map((c) => ({
      id: c._id.toString(),
      text: c.text,
      authorId: c.authorId._id?.toString() ?? c.authorId.toString(),
      authorName: (c.authorId as unknown as { name: string }).name ?? "Member",
      createdAt: c.createdAt,
    })),
  });
}

const CommentSchema = z.object({ text: z.string().min(1).max(1000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  const [comment, user] = await Promise.all([
    Comment.create({
      contentType: "sermon",
      contentId: id,
      authorId: userId,
      text: parsed.data.text,
    }),
    User.findById(userId).select("name").lean(),
  ]);

  return NextResponse.json(
    {
      id: comment._id.toString(),
      text: comment.text,
      authorId: userId,
      authorName: user?.name ?? "Member",
      createdAt: comment.createdAt,
    },
    { status: 201 }
  );
}
