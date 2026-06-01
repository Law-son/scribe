import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISermon extends Document {
  title: string;
  preacher: string;
  date: Date;
  content: object; // Tiptap JSON
  videoUrl?: string;
  pdfUrl?: string;
  coverImage?: string;
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  viewsCount: number;
  status: "draft" | "published";
  publishedAt?: Date;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SermonSchema = new Schema<ISermon>(
  {
    title: { type: String, required: true, trim: true },
    preacher: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    videoUrl: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
    coverImage: { type: String },
    tags: [{ type: String, trim: true }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SermonSchema.index({ status: 1, publishedAt: -1 });
SermonSchema.index({ title: "text", preacher: "text", tags: "text" });

const Sermon: Model<ISermon> =
  mongoose.models.Sermon || mongoose.model<ISermon>("Sermon", SermonSchema);

export default Sermon;
