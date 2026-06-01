import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { startOfMonth, startOfYear, subDays } from "date-fns";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Sermon from "@/models/Sermon";
import BibleStudy from "@/models/BibleStudy";
import Devotional from "@/models/Devotional";
import Announcement from "@/models/Announcement";
import Convert from "@/models/Convert";

export async function GET() {
  const headersList = await headers();
  if (headersList.get("x-user-role") !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    totalUsers,
    activeUsers,
    newThisMonth,
    sermonsMonth,
    sermonsYear,
    bibleStudiesMonth,
    bibleStudiesYear,
    devotionalsMonth,
    devotionalsYear,
    announcementsMonth,
    announcementsYear,
    soulsMonth,
    soulsYear,
  ] = await Promise.all([
    User.countDocuments({ role: "member" }),
    User.countDocuments({ role: "member", lastLoginAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ role: "member", createdAt: { $gte: monthStart } }),
    Sermon.countDocuments({ status: "published", publishedAt: { $gte: monthStart } }),
    Sermon.countDocuments({ status: "published", publishedAt: { $gte: yearStart } }),
    BibleStudy.countDocuments({ status: "published", publishedAt: { $gte: monthStart } }),
    BibleStudy.countDocuments({ status: "published", publishedAt: { $gte: yearStart } }),
    Devotional.countDocuments({ status: "approved", approvedAt: { $gte: monthStart } }),
    Devotional.countDocuments({ status: "approved", approvedAt: { $gte: yearStart } }),
    Announcement.countDocuments({ createdAt: { $gte: monthStart } }),
    Announcement.countDocuments({ createdAt: { $gte: yearStart } }),
    Convert.countDocuments({ status: "verified", verifiedAt: { $gte: monthStart } }),
    Convert.countDocuments({ status: "verified", verifiedAt: { $gte: yearStart } }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers,
    newThisMonth,
    sermons: { month: sermonsMonth, year: sermonsYear },
    bibleStudies: { month: bibleStudiesMonth, year: bibleStudiesYear },
    devotionals: { month: devotionalsMonth, year: devotionalsYear },
    announcements: { month: announcementsMonth, year: announcementsYear },
    soulsWon: { month: soulsMonth, year: soulsYear },
  });
}
