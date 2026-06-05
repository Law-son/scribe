import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminActivity extends Document {
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AdminActivitySchema = new Schema<IAdminActivity>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    targetLabel: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false }
);

AdminActivitySchema.index({ createdAt: -1 });
AdminActivitySchema.index({ actorId: 1, createdAt: -1 });

const AdminActivity: Model<IAdminActivity> =
  mongoose.models.AdminActivity ||
  mongoose.model<IAdminActivity>("AdminActivity", AdminActivitySchema);

export default AdminActivity;
