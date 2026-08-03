import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dayString, getDayRecords } from "@/lib/attendance";

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || dayString();
  const search = searchParams.get("search")?.trim() ?? "";

  const data = await getDayRecords(date, search);
  return NextResponse.json(data);
}
