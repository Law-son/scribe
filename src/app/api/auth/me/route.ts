import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(userId).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    totalPoints: user.totalPoints,
    membershipType: user.membershipType,
    location: user.location,
    gender: user.gender,
    isActive: user.isActive,
  });
}

const UpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  gender: z.enum(["male", "female"]).optional(),
  membershipType: z.enum(["member", "visitor", "invitee", "convert"]).optional(),
  location: z.string().min(2).max(200).optional(),
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return phone;
}

export async function PATCH(req: NextRequest) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();

  const updates: Record<string, string> = { ...parsed.data } as Record<string, string>;

  if (parsed.data.phone) {
    const normalized = normalizePhone(parsed.data.phone);
    const conflict = await User.findOne({ phone: normalized, _id: { $ne: userId } }).lean();
    if (conflict) {
      return NextResponse.json({ error: "That phone number is already in use" }, { status: 409 });
    }
    updates.phone = normalized;
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    gender: user.gender,
    membershipType: user.membershipType,
    location: user.location,
  });
}
