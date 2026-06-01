import connectDB from "./db";
import PointTransaction from "@/models/PointTransaction";
import User from "@/models/User";
import type { PointAction } from "@/types";

const POINT_VALUES: Record<PointAction, number> = {
  daily_login: 2,
  view_sermon: 5,
  read_bible_study: 5,
  read_devotional: 5,
  read_quote: 1,
  register_convert: 15,
};

interface AwardOptions {
  userId: string;
  action: PointAction;
  contentId?: string;
}

/**
 * Awards points to a user. Idempotent — silently returns false if already awarded.
 * Uses DB-level unique indexes for race-condition safety.
 */
export async function awardPoints({
  userId,
  action,
  contentId,
}: AwardOptions): Promise<boolean> {
  await connectDB();

  const points = POINT_VALUES[action];
  const day =
    action === "daily_login"
      ? new Date().toISOString().slice(0, 10)
      : undefined;

  const doc: Record<string, unknown> = { userId, action, points };
  if (day) doc.day = day;
  if (contentId) doc.contentId = contentId;

  try {
    await PointTransaction.create(doc);
    await User.findByIdAndUpdate(userId, { $inc: { totalPoints: points } });
    return true;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return false; // Duplicate — already awarded
    }
    throw err;
  }
}

export { POINT_VALUES };
