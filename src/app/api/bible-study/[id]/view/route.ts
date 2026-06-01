import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import BibleStudy from "@/models/BibleStudy";
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
  await BibleStudy.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
  const awarded = await awardPoints({ userId, action: "read_bible_study", contentId: id });
  return NextResponse.json({ awarded });
}
