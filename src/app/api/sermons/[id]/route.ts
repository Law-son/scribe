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
  const role = headersList.get("x-user-role");

  await connectDB();
  // Admins can view any sermon (including drafts); members only see published
  const query: { _id: string; status?: "draft" | "published" } = { _id: id };
  if (role !== "admin") query.status = "published";
  const sermon = await Sermon.findOne(query).lean();
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
  const silent = body.silent === true;
  delete body.silent;

  if (body.status === "published" && !wasPublished) {
    body.publishedAt = new Date();
  }

  Object.assign(existing, body);
  await existing.save();

  // Skip SMS when the change came from a silent visibility toggle on the dashboard
  if (body.status === "published" && !wasPublished && !silent) {
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
