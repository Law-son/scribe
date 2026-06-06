import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConvert extends Document {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  registeredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConvertSchema = new Schema<IConvert>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ConvertSchema.index({ registeredBy: 1, createdAt: -1 });
ConvertSchema.index({ createdAt: -1 });

const Convert: Model<IConvert> =
  mongoose.models.Convert ||
  mongoose.model<IConvert>("Convert", ConvertSchema);

export default Convert;
