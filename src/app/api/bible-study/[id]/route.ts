import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import BibleStudy from "@/models/BibleStudy";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  await connectDB();
  const doc = await BibleStudy.findOne({ _id: id, status: "published" }).lean();
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
  const doc = await BibleStudy.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status === "published" && doc.status !== "published") body.publishedAt = new Date();
  Object.assign(doc, body);
  await doc.save();
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
  await BibleStudy.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
