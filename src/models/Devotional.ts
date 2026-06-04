import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDevotional extends Document {
  topic: string;
  dayNumber: number;
  weekNumber: string; // e.g. "01", "02"
  weekTheme?: string;
  verse?: string;
  verseText?: string;
  verseTranslation?: string;
  content: object; // Tiptap JSON
  scheduledAt: Date;
  status: "pending" | "approved" | "rejected";
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  viewsCount: number;
  authorId: mongoose.Types.ObjectId;
  // legacy
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DevotionalSchema = new Schema<IDevotional>(
  {
    topic: { type: String, required: true, trim: true },
    dayNumber: { type: Number, required: true },
    weekNumber: { type: String, trim: true, default: "01" },
    weekTheme: { type: String, trim: true },
    verse: { type: String, trim: true },
    verseText: { type: String, trim: true },
    verseTranslation: { type: String, trim: true },
    content: { type: Schema.Types.Mixed, required: true },
    scheduledAt: { type: Date, default: Date.now },
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
    title: { type: String, trim: true }, // legacy / auto-set
  },
  { timestamps: true }
);

DevotionalSchema.index({ status: 1, scheduledAt: 1 });
DevotionalSchema.index({ dayNumber: 1 });

const Devotional: Model<IDevotional> =
  mongoose.models.Devotional ||
  mongoose.model<IDevotional>("Devotional", DevotionalSchema);

export default Devotional;
