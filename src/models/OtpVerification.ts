import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtpVerification extends Document {
  phone: string;
  codeHash: string;
  resetToken?: string;
  verified: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    phone: { type: String, required: true, trim: true },
    codeHash: { type: String, required: true },
    resetToken: { type: String },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OtpVerificationSchema.index({ phone: 1 });
OtpVerificationSchema.index({ resetToken: 1 });
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>("OtpVerification", OtpVerificationSchema);

export default OtpVerification;
