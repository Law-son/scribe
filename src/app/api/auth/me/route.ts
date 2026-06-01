import { NextResponse } from "next/server";
import { headers } from "next/headers";
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
