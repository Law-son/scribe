import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["member", "admin"]).optional(),
  isActive: z.boolean().optional(),
  location: z.string().optional(),
  membershipType: z.enum(["member", "visitor", "invitee", "convert"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const user = await User.findById(id).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...user, id: user._id.toString(), _id: undefined });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const user = await User.findByIdAndUpdate(id, parsed.data, { new: true }).select("-password");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: user._id.toString() });
}
