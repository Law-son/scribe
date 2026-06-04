import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBibleStudy extends Document {
  topic: string;
  date: Date;
  content: object; // Tiptap JSON
  // legacy fields kept for backward compat
  title?: string;
  category?: string;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  viewsCount: number;
  status: "draft" | "published";
  publishedAt?: Date;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BibleStudySchema = new Schema<IBibleStudy>(
  {
    topic: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    title: { type: String, trim: true },
    category: { type: String, trim: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

BibleStudySchema.index({ status: 1, publishedAt: -1 });
BibleStudySchema.index({ topic: "text" });

const BibleStudy: Model<IBibleStudy> =
  mongoose.models.BibleStudy ||
  mongoose.model<IBibleStudy>("BibleStudy", BibleStudySchema);

export default BibleStudy;
