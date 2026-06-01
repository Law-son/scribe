import mongoose, { Schema, Document, Model } from "mongoose";
import type { PointAction } from "@/types";

export interface IPointTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  action: PointAction;
  points: number;
  contentId?: mongoose.Types.ObjectId;
  day?: string; // 'YYYY-MM-DD' UTC, used for daily_login uniqueness
  createdAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "daily_login",
        "view_sermon",
        "read_bible_study",
        "read_devotional",
        "read_quote",
        "register_convert",
      ],
      required: true,
    },
    points: { type: Number, required: true },
    contentId: { type: Schema.Types.ObjectId },
    day: { type: String }, // e.g. '2026-05-31'
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One point award per content item per user
PointTransactionSchema.index(
  { userId: 1, action: 1, contentId: 1 },
  {
    unique: true,
    partialFilterExpression: { contentId: { $exists: true } },
    name: "unique_content_action",
  }
);

// One daily login bonus per UTC day per user
PointTransactionSchema.index(
  { userId: 1, action: 1, day: 1 },
  {
    unique: true,
    partialFilterExpression: { action: "daily_login" },
    name: "unique_daily_login",
  }
);

// For leaderboard aggregation
PointTransactionSchema.index({ createdAt: 1, userId: 1 });

const PointTransaction: Model<IPointTransaction> =
  mongoose.models.PointTransaction ||
  mongoose.model<IPointTransaction>("PointTransaction", PointTransactionSchema);

export default PointTransaction;
