import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import AdminActivity from "@/models/AdminActivity";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    AdminActivity.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminActivity.countDocuments({}),
  ]);

  return NextResponse.json({
    data: data.map((a) => ({ ...a, id: a._id.toString(), _id: undefined })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
