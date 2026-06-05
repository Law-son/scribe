import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Comment from "@/models/Comment";
import User from "@/models/User";
import Sermon from "@/models/Sermon";
import { sendSMS } from "@/lib/sms";

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
      authorName: (c.authorId as unknown as { name?: string }).name ?? "Member",
      createdAt: c.createdAt,
      parentId: c.parentId?.toString() ?? null,
      likesCount: c.likesCount ?? 0,
    })),
  });
}

const CommentSchema = z.object({
  text: z.string().min(1).max(1000),
  parentId: z.string().optional(),
});

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
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { text, parentId } = parsed.data;

  await connectDB();

  const commentData: Record<string, unknown> = { contentType: "sermon", contentId: id, authorId: userId, text };
  if (parentId) commentData.parentId = parentId;

  const [comment, user, sermon] = await Promise.all([
    Comment.create(commentData),
    User.findById(userId).select("name").lean(),
    Sermon.findById(id).select("title preacher").lean(),
  ]);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").replace(/\/$/, "");
  const sermonUrl = `${baseUrl}/sermons/${id}`;

  // Fire-and-forget SMS notifications
  if (sermon) {
    (async () => {
      try {
        if (parentId) {
          const parent = await Comment.findById(parentId)
            .populate<{ authorId: { _id: { toString(): string }; name: string; phone: string } }>("authorId", "name phone")
            .lean();
          const parentAuthor = parent?.authorId;
          if (parentAuthor?.phone && parentAuthor._id.toString() !== userId) {
            await sendSMS(
              [parentAuthor.phone],
              `Hello, ${user?.name ?? "Someone"} replied to your comment on sermon "${sermon.title}". Here: ${sermonUrl}`
            );
          }
        } else {
          const preacher = await User.findOne({ name: sermon.preacher }).select("phone name").lean();
          if (preacher?.phone && preacher._id.toString() !== userId) {
            await sendSMS(
              [preacher.phone],
              `Hello, ${user?.name ?? "Someone"} commented on your sermon "${sermon.title}". Here: ${sermonUrl}`
            );
          }
        }
      } catch {}
    })();
  }

  return NextResponse.json(
    {
      id: comment._id.toString(),
      text: comment.text,
      authorId: userId,
      authorName: user?.name ?? "Member",
      createdAt: comment.createdAt.toISOString(),
      parentId: parentId ?? null,
      likesCount: 0,
      isLiked: false,
      replies: [],
    },
    { status: 201 }
  );
}
