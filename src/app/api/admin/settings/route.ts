import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export async function GET() {
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const settings = await SiteSettings.findOne({ key: "main" }).lean();
  return NextResponse.json(settings ?? {});
}

export async function PUT(req: NextRequest) {
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  await connectDB();

  const current = await SiteSettings.findOne({ key: "main" });
  const historyEntries: object[] = [];
  const now = new Date();

  if (current) {
    // Archive annual theme if year or theme text changed
    const newAnnual = body.annualTheme;
    const oldAnnual = current.annualTheme;
    if (newAnnual && oldAnnual && oldAnnual.theme &&
        (oldAnnual.year !== newAnnual.year || oldAnnual.theme !== newAnnual.theme)) {
      historyEntries.push({
        type: "annual",
        label: `${oldAnnual.year} Annual Theme`,
        theme: oldAnnual.theme,
        scripture: oldAnnual.scripture,
        archivedAt: now,
      });
    }

    // Archive changed monthly themes
    const newMonthly: { month: number; year: number; theme: string }[] = body.monthlyThemes ?? [];
    const oldMonthly: { month: number; year: number; theme: string }[] = current.monthlyThemes ?? [];
    for (const oldM of oldMonthly) {
      if (!oldM.theme) continue;
      const newM = newMonthly.find((m) => m.month === oldM.month && m.year === oldM.year);
      if (newM && newM.theme !== oldM.theme) {
        const monthName = new Date(oldM.year, oldM.month - 1).toLocaleString("default", { month: "long" });
        historyEntries.push({
          type: "monthly",
          label: `${monthName} ${oldM.year}`,
          theme: oldM.theme,
          archivedAt: now,
        });
      }
    }

    // Archive changed semester themes
    const newSemesters: { semester: number; year: number; theme: string }[] = body.semesterThemes ?? [];
    const oldSemesters: { semester: number; year: number; theme: string }[] = current.semesterThemes ?? [];
    for (const oldS of oldSemesters) {
      if (!oldS.theme) continue;
      const newS = newSemesters.find((s) => s.semester === oldS.semester && s.year === oldS.year);
      if (newS && newS.theme !== oldS.theme) {
        historyEntries.push({
          type: "semester",
          label: `Semester ${oldS.semester} — ${oldS.year}`,
          theme: oldS.theme,
          archivedAt: now,
        });
      }
    }
  }

  // Build the update — keep $set and $push as siblings, never nested
  const setFields = {
    socialLinks: body.socialLinks ?? {},
    customSocialLinks: body.customSocialLinks ?? [],
    annualTheme: body.annualTheme,
    monthlyThemes: body.monthlyThemes ?? [],
    semesterThemes: body.semesterThemes ?? [],
  };

  const mongoUpdate = historyEntries.length > 0
    ? { $set: setFields, $push: { themeHistory: { $each: historyEntries } } }
    : { $set: setFields };

  const doc = await SiteSettings.findOneAndUpdate(
    { key: "main" },
    mongoUpdate,
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, id: doc._id.toString() });
}
