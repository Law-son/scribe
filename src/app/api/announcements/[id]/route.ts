import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  await connectDB();
  const doc = await Announcement.findByIdAndUpdate(id, body, { new: true });
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
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
