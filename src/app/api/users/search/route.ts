import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  await connectDB();

  const users = await User.find({
    name: { $regex: q, $options: "i" },
    isActive: true,
  })
    .select("_id name phone")
    .limit(10)
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      phone: u.phone,
    })),
  });
}
