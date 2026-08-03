import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendanceSession extends Document {
  startedBy: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  isActive: boolean;
  autoClosed: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    autoClosed: { type: Boolean, default: false },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, required: true },
    label: { type: String, trim: true },
  },
  { timestamps: true }
);

// At most one active session at a time — enforced by the database, not app
// logic, so a double-start (double-click, or two admins) can't race past a
// check-then-create window. Sessions are never deleted (permanent history),
// so this can't use a TTL index like the OTP/reset-token models do.
AttendanceSessionSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: "one_active_session" }
);

AttendanceSessionSchema.index({ startedAt: -1 });

const AttendanceSession: Model<IAttendanceSession> =
  mongoose.models.AttendanceSession ||
  mongoose.model<IAttendanceSession>("AttendanceSession", AttendanceSessionSchema);

export default AttendanceSession;
