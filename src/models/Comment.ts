import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
  contentType: "sermon" | "bible_study" | "devotional" | "quote";
  contentId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    contentType: {
      type: String,
      enum: ["sermon", "bible_study", "devotional", "quote"],
      required: true,
    },
    contentId: { type: Schema.Types.ObjectId, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

CommentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });
CommentSchema.index({ authorId: 1 });

const Comment: Model<IComment> =
  mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
