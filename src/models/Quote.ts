import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuote extends Document {
  text: string;
  author: string;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  status: "draft" | "published";
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    text: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

QuoteSchema.index({ status: 1, createdAt: -1 });

const Quote: Model<IQuote> =
  mongoose.models.Quote || mongoose.model<IQuote>("Quote", QuoteSchema);

export default Quote;
