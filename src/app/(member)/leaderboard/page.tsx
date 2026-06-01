import { headers } from "next/headers";
import { startOfWeek, startOfMonth } from "date-fns";
import connectDB from "@/lib/db";
import PointTransaction from "@/models/PointTransaction";

export const metadata = { title: "Community Champions" };

async function getLeaderboard(since: Date, limit = 50) {
  const entries = await PointTransaction.aggregate([
    { $match: { createdAt: { $gte: since } } },
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

export default async function LeaderboardPage() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  await connectDB();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [weekly, monthly] = await Promise.all([
    getLeaderboard(weekStart, 50),
    getLeaderboard(monthStart, 50),
  ]);

  function renderTable(
    entries: { userId: string; name: string; points: number; rank: number }[],
    currentUserId: string | null
  ) {
    if (entries.length === 0) {
      return <p className="text-center text-navy/40 font-body py-10">No activity yet this period.</p>;
    }
    return (
      <div className="space-y-2">
        {entries.map((entry) => {
          const isCurrent = entry.userId === currentUserId;
          const isTop3 = entry.rank <= 3;
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${
                isCurrent
                  ? "bg-gold/10 border border-gold/40"
                  : isTop3
                  ? "bg-cream border border-cream-dark"
                  : "bg-white border border-cream-dark"
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-xl">{RANK_ICONS[entry.rank - 1]}</span>
                ) : (
                  <span className="text-sm font-body font-semibold text-navy/50">#{entry.rank}</span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`font-body font-medium truncate ${isCurrent ? "text-navy font-semibold" : "text-navy"}`}>
                  {entry.name}
                  {isCurrent && <span className="ml-2 text-xs text-gold-dark">(You)</span>}
                </p>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <p className={`font-heading font-bold ${entry.rank === 1 ? "shimmer-gold text-lg" : "text-navy"}`}>
                  {entry.rank === 1 ? entry.points.toLocaleString() : entry.points.toLocaleString()}
                </p>
                <p className="text-xs text-navy/40 font-body">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <p className="text-3xl mb-2">🏆</p>
        <h1 className="font-heading text-3xl text-navy font-bold">Community Champions</h1>
        <p className="text-navy/60 font-body mt-2">
          Celebrating faithful servants who engage consistently with God&apos;s Word.
        </p>
      </div>

      {/* Weekly */}
      <section className="mb-10">
        <h2 className="font-heading text-xl text-navy font-semibold mb-4 flex items-center gap-2">
          <span>⚡</span> This Week&apos;s Champions
        </h2>
        {renderTable(weekly, userId)}
      </section>

      {/* Monthly */}
      <section>
        <h2 className="font-heading text-xl text-navy font-semibold mb-4 flex items-center gap-2">
          <span>🌟</span> Monthly Champions
        </h2>
        {monthly.length > 0 && (
          <div className="bg-gradient-to-br from-gold/20 to-amber/10 border border-gold/40 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gold-dark font-body font-semibold uppercase tracking-wider mb-2">Monthly Leader</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">👑</span>
              <div>
                <p className="font-heading text-2xl text-navy font-bold">{monthly[0]?.name}</p>
                <p className={`font-heading text-lg font-bold shimmer-gold`}>
                  {monthly[0]?.points.toLocaleString()} points
                </p>
              </div>
            </div>
          </div>
        )}
        {renderTable(monthly.slice(1), userId)}
      </section>
    </div>
  );
}
