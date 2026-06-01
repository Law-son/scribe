import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import { broadcastToAllMembers, SMS_TEMPLATES } from "@/lib/sms";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  await connectDB();
  const sermon = await Sermon.findOne({ _id: id, status: "published" }).lean();
  if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isLiked = userId
    ? sermon.likes.some((l) => l.toString() === userId)
    : false;

  return NextResponse.json({
    ...sermon,
    id: sermon._id.toString(),
    _id: undefined,
    likes: undefined,
    isLiked,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  await connectDB();

  const existing = await Sermon.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wasPublished = existing.status === "published";

  if (body.status === "published" && !wasPublished) {
    body.publishedAt = new Date();
  }

  Object.assign(existing, body);
  await existing.save();

  if (body.status === "published" && !wasPublished) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/sermons/${id}`;
    Promise.resolve().then(() =>
      broadcastToAllMembers(SMS_TEMPLATES.sermon(existing.title, url))
    );
  }

  return NextResponse.json({ id: existing._id.toString() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  await Sermon.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
