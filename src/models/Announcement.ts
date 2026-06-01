import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  isUrgent: boolean;
  smsTriggered: boolean;
  smsSentAt?: Date;
  expiresAt?: Date;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isUrgent: { type: Boolean, default: false },
    smsTriggered: { type: Boolean, default: false },
    smsSentAt: { type: Date },
    expiresAt: { type: Date },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 }, { sparse: true });

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;
