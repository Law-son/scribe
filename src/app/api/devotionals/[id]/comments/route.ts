import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import { getComments, postComment } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return getComments("devotional", id);
}

const CommentSchema = z.object({ text: z.string().min(1).max(1000), parentId: z.string().optional() });

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

  await connectDB();
  const doc = await Devotional.findById(id).select("title topic").lean();
  const title = doc?.topic ?? doc?.title ?? undefined;

  return postComment("devotional", id, userId, parsed.data.text, parsed.data.parentId, title);
}
