import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Convert from "@/models/Convert";
import User from "@/models/User";
import { awardPoints } from "@/lib/points";
import { logActivity } from "@/lib/logActivity";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const adminId = headersList.get("x-user-id");
  if (role !== "admin" || !adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const convert = await Convert.findById(id);
  if (!convert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (convert.status !== "pending") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  convert.status = "verified";
  convert.verifiedBy = adminId as unknown as import("mongoose").Types.ObjectId;
  convert.verifiedAt = new Date();
  await convert.save();

  // Award +15 points to the member who registered the convert
  const awarded = await awardPoints({
    userId: convert.registeredBy.toString(),
    action: "register_convert",
    contentId: id,
  });

  const admin = await User.findById(adminId).select("name").lean();
  logActivity({
    actorId: adminId,
    actorName: admin?.name ?? "Admin",
    action: `Verified convert: ${convert.name}`,
    targetType: "convert",
    targetId: id,
    targetLabel: convert.name,
  });

  return NextResponse.json({ ok: true, awarded });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const adminId = headersList.get("x-user-id");
  if (role !== "admin" || !adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const convert = await Convert.findByIdAndUpdate(id, { status: "rejected", verifiedBy: adminId, verifiedAt: new Date() }, { new: false });
  const admin = await User.findById(adminId).select("name").lean();
  logActivity({
    actorId: adminId,
    actorName: admin?.name ?? "Admin",
    action: `Rejected convert: ${convert?.name ?? id}`,
    targetType: "convert",
    targetId: id,
    targetLabel: convert?.name,
  });
  return NextResponse.json({ ok: true });
}
