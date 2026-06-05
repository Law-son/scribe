import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const settings = await SiteSettings.findOne({ key: "main" }).lean();
    return NextResponse.json(settings ?? {});
  } catch (err) {
    console.error("[Settings GET]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();

    const current = await SiteSettings.findOne({ key: "main" }).lean();
    const historyEntries: object[] = [];
    const now = new Date();

    if (current) {
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

      const newMonthly: { month: number; year: number; theme: string }[] = body.monthlyThemes ?? [];
      const oldMonthly: { month: number; year: number; theme: string }[] = current.monthlyThemes ?? [];
      for (const oldM of oldMonthly) {
        if (!oldM.theme) continue;
        const newM = newMonthly.find((m) => m.month === oldM.month && m.year === oldM.year);
        if (newM && newM.theme !== oldM.theme) {
          const monthName = new Date(oldM.year, oldM.month - 1).toLocaleString("default", { month: "long" });
          historyEntries.push({ type: "monthly", label: `${monthName} ${oldM.year}`, theme: oldM.theme, archivedAt: now });
        }
      }

      const newSemesters: { semester: number; year: number; theme: string }[] = body.semesterThemes ?? [];
      const oldSemesters: { semester: number; year: number; theme: string }[] = current.semesterThemes ?? [];
      for (const oldS of oldSemesters) {
        if (!oldS.theme) continue;
        const newS = newSemesters.find((s) => s.semester === oldS.semester && s.year === oldS.year);
        if (newS && newS.theme !== oldS.theme) {
          historyEntries.push({ type: "semester", label: `Semester ${oldS.semester} — ${oldS.year}`, theme: oldS.theme, archivedAt: now });
        }
      }
    }

    const setFields = {
      socialLinks: body.socialLinks ?? {},
      customSocialLinks: (body.customSocialLinks ?? []).filter(
        (l: { platform?: string; label?: string; url?: string }) => l.platform && l.label && l.url
      ),
      annualTheme: body.annualTheme ?? {},
      monthlyThemes: body.monthlyThemes ?? [],
      semesterThemes: body.semesterThemes ?? [],
    };

    const mongoUpdate = historyEntries.length > 0
      ? { $set: setFields, $push: { themeHistory: { $each: historyEntries } } }
      : { $set: setFields };

    const doc = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      mongoUpdate,
      { upsert: true, new: true, runValidators: false, strict: false }
    );

    return NextResponse.json({ ok: true, id: doc?._id?.toString() ?? "ok" });
  } catch (err) {
    console.error("[Settings PUT]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
