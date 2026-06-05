import { NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Convert from "@/models/Convert";
import PointTransaction from "@/models/PointTransaction";

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const [referredUsers, registeredConverts] = await Promise.all([
    User.find({ referredBy: userId })
      .select("name membershipType lastLoginAt totalPoints createdAt isActive")
      .sort({ createdAt: -1 })
      .lean(),
    Convert.find({ registeredBy: userId })
      .select("name phone status createdAt verifiedAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // For referred users, get their activity counts
  const userIds = referredUsers.map((u) => u._id);
  const activityCounts = await PointTransaction.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(activityCounts.map((a) => [a._id.toString(), a.count]));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return NextResponse.json({
    referredUsers: referredUsers.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      membershipType: u.membershipType,
      totalPoints: u.totalPoints,
      lastLoginAt: u.lastLoginAt ?? null,
      isActive: u.isActive,
      activityCount: countMap.get(u._id.toString()) ?? 0,
      recentlyActive: u.lastLoginAt ? new Date(u.lastLoginAt) >= thirtyDaysAgo : false,
      joinedAt: u.createdAt,
    })),
    registeredConverts: registeredConverts.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      phone: c.phone ?? null,
      status: c.status,
      createdAt: c.createdAt,
      verifiedAt: c.verifiedAt ?? null,
    })),
  });
}
