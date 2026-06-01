import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Quote from "@/models/Quote";
import { awardPoints } from "@/lib/points";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const doc = await Quote.findById(id).select("likes likesCount");
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uid = new mongoose.Types.ObjectId(userId);
  const isLiked = doc.likes.some((l) => l.equals(uid));

  if (isLiked) {
    await Quote.findByIdAndUpdate(id, { $pull: { likes: uid }, $inc: { likesCount: -1 } });
  } else {
    await Quote.findByIdAndUpdate(id, { $addToSet: { likes: uid }, $inc: { likesCount: 1 } });
    // Award point for reading quote (once per quote, idempotent)
    Promise.resolve().then(() => awardPoints({ userId, action: "read_quote", contentId: id }));
  }

  const updated = await Quote.findById(id).select("likesCount");
  return NextResponse.json({ liked: !isLiked, likesCount: updated?.likesCount ?? 0 });
}
