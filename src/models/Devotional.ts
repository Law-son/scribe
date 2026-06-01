import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDevotional extends Document {
  title: string;
  verse?: string;
  verseText?: string;
  content: object; // Tiptap JSON
  scheduledAt: Date;
  status: "pending" | "approved" | "rejected";
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  viewsCount: number;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DevotionalSchema = new Schema<IDevotional>(
  {
    title: { type: String, required: true, trim: true },
    verse: { type: String, trim: true },
    verseText: { type: String, trim: true },
    content: { type: Schema.Types.Mixed, required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Visibility rule: status === 'approved' && scheduledAt <= now (computed on read)
DevotionalSchema.index({ status: 1, scheduledAt: 1 });

const Devotional: Model<IDevotional> =
  mongoose.models.Devotional ||
  mongoose.model<IDevotional>("Devotional", DevotionalSchema);

export default Devotional;
