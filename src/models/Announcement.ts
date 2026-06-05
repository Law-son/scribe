import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  isUrgent: boolean;
  smsTriggered: boolean;
  smsSentAt?: Date;
  // SMS progress tracking
  smsTotal: number;
  smsSent: number;
  smsFailed: number;
  smsDone: boolean;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, maxlength: 160 },
    isUrgent: { type: Boolean, default: false },
    smsTriggered: { type: Boolean, default: false },
    smsSentAt: { type: Date },
    smsTotal: { type: Number, default: 0 },
    smsSent: { type: Number, default: 0 },
    smsFailed: { type: Number, default: 0 },
    smsDone: { type: Boolean, default: false },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;
