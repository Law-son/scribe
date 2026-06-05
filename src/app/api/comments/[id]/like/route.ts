import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Comment from "@/models/Comment";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const comment = await Comment.findById(id);
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userObjId = new mongoose.Types.ObjectId(userId);
  const isLiked = (comment.likes as mongoose.Types.ObjectId[]).some((l) => l.equals(userObjId));

  if (isLiked) {
    (comment as unknown as { likes: { pull: (id: mongoose.Types.ObjectId) => void } }).likes.pull(userObjId);
    comment.likesCount = Math.max(0, comment.likesCount - 1);
  } else {
    (comment as unknown as { likes: { addToSet: (id: mongoose.Types.ObjectId) => void } }).likes.addToSet(userObjId);
    comment.likesCount += 1;
  }

  await comment.save();
  return NextResponse.json({ liked: !isLiked, likesCount: comment.likesCount });
}
