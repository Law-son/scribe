import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/lib/db";
import Convert from "@/models/Convert";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const role = headersList.get("x-user-role");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const query = role === "admin" ? {} : { registeredBy: userId };
  const [data, total] = await Promise.all([
    Convert.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("registeredBy", "name").lean(),
    Convert.countDocuments(query),
  ]);

  return NextResponse.json({
    data: data.map((c) => ({ ...c, id: c._id.toString(), _id: undefined })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const doc = await Convert.create({ ...parsed.data, registeredBy: userId });
  return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
}
