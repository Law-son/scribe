import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  phone: string;
  whatsapp?: string;
  email?: string;
  password: string;
  name: string;
  dateOfBirth?: Date;
  gender?: string;
  membershipType: string;
  isStudent: boolean;
  programmeOfStudy?: string;
  level?: string;
  location: string;
  departmentInChurch?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  role: "member" | "admin";
  totalPoints: number;
  profilePhoto?: string;
  isActive: boolean;
  referredBy?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    membershipType: {
      type: String,
      required: true,
      enum: ["member", "visitor", "invitee", "convert"],
      default: "member",
    },
    isStudent: { type: Boolean, default: true },
    programmeOfStudy: { type: String, trim: true },
    level: {
      type: String,
      enum: ["year_1", "year_2", "year_3", "year_4"],
    },
    location: { type: String, required: true, trim: true },
    departmentInChurch: {
      type: String,
      enum: ["choir", "media", "evangelism", "ushering", "prayer", "hospitality", "protocol", "other"],
    },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    emergencyContactRelationship: {
      type: String,
      enum: ["mother", "father", "sister", "brother", "guardian", "friend", "other"],
    },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    totalPoints: { type: Number, default: 0 },
    profilePhoto: { type: String },
    isActive: { type: Boolean, default: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ name: "text" });
UserSchema.index({ totalPoints: -1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
