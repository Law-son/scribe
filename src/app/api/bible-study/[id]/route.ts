import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import BibleStudy from "@/models/BibleStudy";
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
  // Admins can view any document (including drafts); members only see published
  const query: { _id: string; status?: "draft" | "published" } = { _id: id };
  if (role !== "admin") query.status = "published";
  const doc = await BibleStudy.findOne(query).lean();
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

  const wasPublished = doc.status === "published";
  const silent = body.silent === true;
  delete body.silent;
  if (body.status === "published" && !wasPublished) body.publishedAt = new Date();
  Object.assign(doc, body);
  await doc.save();

  // Fire SMS when transitioning from draft → published, unless the change
  // came from a silent visibility toggle on the dashboard
  if (body.status === "published" && !wasPublished && !silent) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/bible-study/${doc._id}`;
    Promise.resolve().then(() => broadcastToAllMembers(SMS_TEMPLATES.bibleStudy(url)));
  }

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
