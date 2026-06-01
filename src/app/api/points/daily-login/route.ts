import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { awardPoints } from "@/lib/points";

export async function POST() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const awarded = await awardPoints({ userId, action: "daily_login" });
  return NextResponse.json({ awarded });
}
