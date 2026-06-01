import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  phone: string;
  password: string;
  name: string;
  gender: string;
  membershipType: string;
  location: string;
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
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    membershipType: {
      type: String,
      required: true,
      enum: ["member", "visitor", "invitee", "convert"],
      default: "member",
    },
    location: { type: String, required: true, trim: true },
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
