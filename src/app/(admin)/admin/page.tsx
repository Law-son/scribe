import { startOfMonth, startOfYear, subDays, startOfWeek, format } from "date-fns";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Sermon from "@/models/Sermon";
import BibleStudy from "@/models/BibleStudy";
import Devotional from "@/models/Devotional";
import Announcement from "@/models/Announcement";
import Convert from "@/models/Convert";
import PointTransaction from "@/models/PointTransaction";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  CrossIcon,
  Sunrise,
  Megaphone,
  Sprout,
  Star,
  TrendingUp,
  AlertCircle,
  Trophy,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  href?: string;
  trend?: string;
}

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, href, trend }: StatCardProps) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} strokeWidth={2} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-body text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <TrendingUp size={10} />
            {trend}
          </span>
        )}
      </div>
      <p className="font-heading text-2xl font-bold text-slate-800 mb-0.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-slate-500 font-body">{label}</p>
      {sub && <p className="text-xs text-slate-400 font-body mt-1">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}

export default async function AdminDashboard() {
  await connectDB();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const thirtyDaysAgo = subDays(now, 30);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const [
    totalUsers, activeUsers, newThisMonth,
    sermonsMonth, sermonsYear,
    bibleStudiesMonth, bibleStudiesYear,
    devotionalsMonth, devotionalsYear,
    announcementsMonth,
    soulsMonth, soulsYear,
    pendingConverts,
    weeklyTop5,
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
    Convert.countDocuments({ status: "verified", verifiedAt: { $gte: monthStart } }),
    Convert.countDocuments({ status: "verified", verifiedAt: { $gte: yearStart } }),
    Convert.countDocuments({ status: "pending" }),
    PointTransaction.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      { $group: { _id: "$userId", points: { $sum: "$points" } } },
      { $sort: { points: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, name: "$user.name", points: 1 } },
    ]),
  ]);

  const rankColors = [
    "text-amber-500 bg-amber-50",
    "text-slate-400 bg-slate-50",
    "text-orange-400 bg-orange-50",
    "text-slate-400 bg-slate-50",
    "text-slate-400 bg-slate-50",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 font-body text-sm mt-0.5">
            {format(now, "EEEE, MMMM d, yyyy")} · Platform overview
          </p>
        </div>
      </div>

      {/* Pending converts alert */}
      {pendingConverts > 0 && (
        <Link href="/admin/evangelism">
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-amber-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="font-body font-semibold text-amber-800 text-sm">
                {pendingConverts} convert{pendingConverts !== 1 ? "s" : ""} awaiting verification
              </p>
              <p className="text-xs text-amber-600 font-body mt-0.5">Review and verify new souls won →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Members */}
      <div>
        <h2 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Members</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Members"
            value={totalUsers}
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            href="/admin/users"
          />
          <StatCard
            label="Active (Last 30 Days)"
            value={activeUsers}
            icon={UserCheck}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            label="New This Month"
            value={newThisMonth}
            icon={UserPlus}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
          />
        </div>
      </div>

      {/* Content */}
      <div>
        <h2 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Content This Month</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Sermons"
            value={sermonsMonth}
            sub={`${sermonsYear} this year`}
            icon={BookOpen}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            href="/admin/sermons"
          />
          <StatCard
            label="Bible Studies"
            value={bibleStudiesMonth}
            sub={`${bibleStudiesYear} this year`}
            icon={CrossIcon}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
            href="/admin/bible-study"
          />
          <StatCard
            label="Devotionals"
            value={devotionalsMonth}
            sub={`${devotionalsYear} this year`}
            icon={Sunrise}
            iconColor="text-orange-500"
            iconBg="bg-orange-50"
            href="/admin/devotionals"
          />
          <StatCard
            label="Announcements"
            value={announcementsMonth}
            icon={Megaphone}
            iconColor="text-pink-600"
            iconBg="bg-pink-50"
            href="/admin/announcements"
          />
        </div>
      </div>

      {/* Evangelism */}
      <div>
        <h2 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Evangelism</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Souls Won This Month"
            value={soulsMonth}
            icon={Sprout}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            href="/admin/evangelism"
          />
          <StatCard
            label="Souls Won This Year"
            value={soulsYear}
            icon={Star}
            iconColor="text-amber-500"
            iconBg="bg-amber-50"
            href="/admin/evangelism"
          />
        </div>
      </div>

      {/* Weekly leaderboard */}
      {weeklyTop5.length > 0 && (
        <div>
          <h2 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            This Week&apos;s Top Members
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" strokeWidth={2} />
              <span className="font-body font-semibold text-slate-700 text-sm">Engagement Leaders</span>
            </div>
            {weeklyTop5.map((entry: { name: string; points: number }, i: number) => (
              <div
                key={entry.name}
                className={`flex items-center gap-4 px-5 py-3.5 ${
                  i < weeklyTop5.length - 1 ? "border-b border-slate-50" : ""
                } ${i === 0 ? "bg-amber-50/40" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankColors[i]}`}>
                  {i + 1}
                </div>
                <span className="flex-1 font-body text-sm text-slate-700 font-medium">{entry.name}</span>
                <span className="font-heading text-sm font-bold text-slate-500">
                  {entry.points.toLocaleString()} <span className="text-xs font-body font-normal text-slate-400">pts</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
