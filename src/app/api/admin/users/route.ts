import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";

  const query: Record<string, unknown> = {};
  if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];

  const [data, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password").lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({
    data: data.map((u) => ({ ...u, id: u._id.toString(), _id: undefined })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
