import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import { awardPoints } from "@/lib/points";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await Devotional.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
  const awarded = await awardPoints({ userId, action: "read_devotional", contentId: id });
  return NextResponse.json({ awarded });
}
