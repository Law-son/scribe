import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

// Public: used by the (unauthenticated) registration form's referral picker,
// as well as the authenticated preacher/speaker search in the content editor.
// Only exposes name + id, never contact info.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  await connectDB();

  const users = await User.find(
    { name: { $regex: q, $options: "i" } },
    { name: 1 }
  )
    .limit(10)
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({ id: u._id.toString(), name: u.name })),
  });
}
