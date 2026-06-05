import connectDB from "@/lib/db";
import AdminActivity from "@/models/AdminActivity";

export async function logActivity(params: {
  actorId: string;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectDB();
    await AdminActivity.create(params);
  } catch {
    // Non-fatal: activity logging should never break the main flow
  }
}
