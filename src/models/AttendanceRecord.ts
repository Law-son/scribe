import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendanceRecord extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userPhone: string;
  checkedInAt: Date;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  distanceMeters: number;
  day: string; // 'YYYY-MM-DD', server-local time — see src/lib/attendance.ts dayString()
  createdAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Denormalized at check-in time — a historical snapshot, intentionally
    // goes stale on rename, so the admin day-lookup search doesn't need a
    // $lookup join against User for every query.
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    checkedInAt: { type: Date, required: true, default: Date.now },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracyMeters: { type: Number, required: true },
    distanceMeters: { type: Number, required: true },
    day: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Primary "already checked in" source of truth — one record per user per
// session, independent of the points system's own idempotency.
AttendanceRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

AttendanceRecordSchema.index({ day: 1 });
AttendanceRecordSchema.index({ userId: 1, checkedInAt: -1 });

const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema);

export default AttendanceRecord;
