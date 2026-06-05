import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "./db";
import Comment from "@/models/Comment";
import User from "@/models/User";
import { sendSMS } from "./sms";
import type { PointAction } from "@/types";

type ContentType = "sermon" | "bible_study" | "devotional" | "quote";

export async function toggleLike(
  model: mongoose.Model<mongoose.Document & { likes: mongoose.Types.ObjectId[]; likesCount: number }>,
  id: string,
  userId: string
) {
  await connectDB();
  const doc = await model.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userObjId = new mongoose.Types.ObjectId(userId);
  const isLiked = (doc.likes as mongoose.Types.ObjectId[]).some((l) => l.equals(userObjId));

  if (isLiked) {
    (doc as unknown as { likes: { pull: (id: mongoose.Types.ObjectId) => void } }).likes.pull(userObjId);
    doc.likesCount = Math.max(0, doc.likesCount - 1);
  } else {
    (doc as unknown as { likes: { addToSet: (id: mongoose.Types.ObjectId) => void } }).likes.addToSet(userObjId);
    doc.likesCount += 1;
  }

  await doc.save();
  return NextResponse.json({ liked: !isLiked, likesCount: doc.likesCount });
}

export async function getComments(contentType: ContentType, contentId: string) {
  await connectDB();
  const comments = await Comment.find({ contentType, contentId })
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
    })),
  });
}

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  sermon: "sermon",
  bible_study: "bible study",
  devotional: "devotional",
  quote: "quote",
};

const CONTENT_TYPE_PATH: Record<ContentType, string> = {
  sermon: "sermons",
  bible_study: "bible-study",
  devotional: "devotionals",
  quote: "quotes",
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").replace(/\/$/, "");
}

export async function postComment(
  contentType: ContentType,
  contentId: string,
  userId: string,
  text: string,
  parentId?: string,
  contentTitle?: string
) {
  await connectDB();

  const commentData: Record<string, unknown> = { contentType, contentId, authorId: userId, text };
  if (parentId) commentData.parentId = parentId;

  const [comment, user] = await Promise.all([
    Comment.create(commentData),
    User.findById(userId).select("name").lean(),
  ]);

  // Notify parent comment author on reply (fire-and-forget)
  if (parentId) {
    (async () => {
      try {
        const parent = await Comment.findById(parentId).populate<{ authorId: { _id: mongoose.Types.ObjectId; name: string; phone: string } }>("authorId", "name phone").lean();
        const parentAuthor = parent?.authorId;
        if (parentAuthor?.phone && parentAuthor._id.toString() !== userId) {
          const typeLabel = CONTENT_TYPE_LABEL[contentType];
          const link = `${appUrl()}/${CONTENT_TYPE_PATH[contentType]}/${contentId}`;
          const title = contentTitle ? ` "${contentTitle}"` : "";
          await sendSMS(
            [parentAuthor.phone],
            `Hello, ${user?.name ?? "Someone"} replied to your comment on ${typeLabel}${title}. Here: ${link}`
          );
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

export function requireAdmin(role: string | null, userId: string | null) {
  if (role !== "admin" || !userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function requireAuth(userId: string | null) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
