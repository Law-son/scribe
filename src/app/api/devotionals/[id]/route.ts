import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const role = headersList.get("x-user-role");

  await connectDB();
  const now = new Date();

  // Admins can see any; members only see approved+scheduled
  const query =
    role === "admin"
      ? { _id: id }
      : { _id: id, status: "approved" as const, scheduledAt: { $lte: now } };

  const doc = await Devotional.findOne(query).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isLiked = userId ? doc.likes.some((l) => l.toString() === userId) : false;
  return NextResponse.json({ ...doc, id: doc._id.toString(), _id: undefined, likes: undefined, isLiked });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  await connectDB();
  const doc = await Devotional.findByIdAndUpdate(id, body, { new: true });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: doc._id.toString() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  await Devotional.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
