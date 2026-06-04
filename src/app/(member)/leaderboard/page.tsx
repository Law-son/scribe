import { headers } from "next/headers";
import { startOfMonth, endOfMonth } from "date-fns";
import connectDB from "@/lib/db";
import PointTransaction from "@/models/PointTransaction";
import LeaderboardFilter from "./LeaderboardFilter";

export const metadata = { title: "Community Champions" };

async function getLeaderboard(from: Date, to: Date, limit = 50) {
  const entries = await PointTransaction.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: "$userId", points: { $sum: "$points" } } },
    { $sort: { points: -1 } },
    { $limit: limit },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { _id: 0, userId: { $toString: "$_id" }, name: "$user.name", points: 1 } },
  ]);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];
const RANK_BG = [
  "bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-300",
  "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300",
  "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  const now = new Date();
  const params = await searchParams;
  const month = Math.min(12, Math.max(1, Number(params.month ?? now.getMonth() + 1)));
  const year = Number(params.year ?? now.getFullYear());

  const periodStart = startOfMonth(new Date(year, month - 1, 1));
  const periodEnd = endOfMonth(periodStart);

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  await connectDB();
  const entries = await getLeaderboard(periodStart, periodEnd, 50);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-3">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="font-heading text-2xl text-navy font-bold">Community Champions</h1>
        <p className="text-navy/50 font-body text-sm mt-1">
          Faithful servants who engage consistently with God&apos;s Word
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <LeaderboardFilter currentMonth={now.getMonth() + 1} currentYear={now.getFullYear()} />
        <p className="text-center text-xs text-navy/40 font-body mt-2">
          {isCurrentMonth ? "This month so far" : `${MONTHS[month - 1]} ${year}`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-body text-navy/50">No activity recorded for this period.</p>
        </div>
      ) : (
        <>
          {/* Top 3 */}
          {top3.length > 0 && (
            <div className="space-y-3 mb-6">
              {top3.map((entry) => {
                const isCurrent = entry.userId === userId;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 rounded-2xl px-5 py-4 border ${
                      isCurrent
                        ? "bg-gradient-to-r from-gold/20 to-amber-50 border-gold/50 ring-2 ring-gold/30"
                        : RANK_BG[entry.rank - 1]
                    }`}
                  >
                    <span className="text-3xl w-9 text-center flex-shrink-0">{RANK_ICONS[entry.rank - 1]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-navy text-base truncate">
                        {entry.name}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-body font-normal text-gold-dark bg-gold/10 px-1.5 py-0.5 rounded-full">
                            you
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-heading font-bold text-lg ${entry.rank === 1 ? "shimmer-gold" : "text-navy"}`}>
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-navy/40 font-body -mt-0.5">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-dark divide-y divide-cream-dark overflow-hidden">
              {rest.map((entry) => {
                const isCurrent = entry.userId === userId;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      isCurrent ? "bg-gold/5" : "hover:bg-cream/40"
                    } transition-colors`}
                  >
                    <span className="w-7 text-center font-body text-sm font-semibold text-navy/40 flex-shrink-0">
                      {entry.rank}
                    </span>
                    <p className="flex-1 font-body text-navy font-medium truncate text-sm">
                      {entry.name}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-gold-dark font-normal">(you)</span>
                      )}
                    </p>
                    <div className="text-right flex-shrink-0">
                      <span className="font-heading font-bold text-navy text-sm">
                        {entry.points.toLocaleString()}
                      </span>
                      <span className="text-xs text-navy/40 font-body ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
