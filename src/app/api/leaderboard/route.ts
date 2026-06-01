import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { startOfWeek, startOfMonth } from "date-fns";
import connectDB from "@/lib/db";
import PointTransaction from "@/models/PointTransaction";
import User from "@/models/User";

async function getLeaderboard(since: Date, limit = 50) {
  const entries = await PointTransaction.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$userId", points: { $sum: "$points" } } },
    { $sort: { points: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: { $toString: "$_id" },
        name: "$user.name",
        points: 1,
      },
    },
  ]);

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function GET() {
  await connectDB();
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const monthStart = startOfMonth(now);

  const [weekly, monthly] = await Promise.all([
    getLeaderboard(weekStart, 50),
    getLeaderboard(monthStart, 50),
  ]);

  // Find current user's rank if not in top 50
  let currentUserRank: { rank: number; points: number } | null = null;
  if (userId) {
    const inWeekly = weekly.find((e) => e.userId === userId);
    if (!inWeekly) {
      const allWeekly = await getLeaderboard(weekStart, 1000);
      const found = allWeekly.find((e) => e.userId === userId);
      if (found) currentUserRank = { rank: found.rank, points: found.points };
    }
  }

  return NextResponse.json({ weekly, monthly, currentUserRank });
}
