import { NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(request: Request) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  await connectDB();

  const users = await User.find(
    q ? { name: { $regex: q, $options: "i" } } : {},
    { name: 1 }
  )
    .limit(10)
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({ id: u._id.toString(), name: u.name })),
  });
}
