import { NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";

export async function GET() {
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const count = await Devotional.countDocuments();
  return NextResponse.json({ count });
}
