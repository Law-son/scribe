import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWeeklyBreakdown } from "@/lib/attendance";

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const now = new Date();

  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  const compareMonthParam = searchParams.get("compareMonth");
  const compareYearParam = searchParams.get("compareYear");

  const primary = await getWeeklyBreakdown(month, year);

  let compare = null;
  if (compareMonthParam && compareYearParam) {
    const compareMonth = Number(compareMonthParam);
    const compareYear = Number(compareYearParam);
    if (Number.isInteger(compareMonth) && compareMonth >= 1 && compareMonth <= 12 && Number.isInteger(compareYear)) {
      compare = { month: compareMonth, year: compareYear, weeks: await getWeeklyBreakdown(compareMonth, compareYear) };
    }
  }

  return NextResponse.json({
    primary: { month, year, weeks: primary },
    compare,
  });
}
