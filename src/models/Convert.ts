import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConvert extends Document {
  name: string;
  phone?: string;
  address?: string;
  registeredBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  status: "pending" | "verified" | "rejected";
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConvertSchema = new Schema<IConvert>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ConvertSchema.index({ status: 1, createdAt: -1 });
ConvertSchema.index({ registeredBy: 1 });

const Convert: Model<IConvert> =
  mongoose.models.Convert ||
  mongoose.model<IConvert>("Convert", ConvertSchema);

export default Convert;
