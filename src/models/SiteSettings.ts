import mongoose, { Schema, Document, Model } from "mongoose";

export interface IThemeHistoryEntry {
  type: "annual" | "monthly" | "semester";
  label: string;
  theme: string;
  scripture?: string;
  archivedAt: Date;
}

export interface ICustomSocialLink {
  platform: string;
  label: string;
  url: string;
}

export interface ISiteSettings extends Document {
  key: string; // always "main" — singleton
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  customSocialLinks: ICustomSocialLink[];
  annualTheme?: {
    year: number;
    theme: string;
    scripture?: string;
  };
  monthlyThemes: { month: number; year: number; theme: string }[];
  semesterThemes: { semester: number; year: number; theme: string }[];
  themeHistory: IThemeHistoryEntry[];
  updatedAt: Date;
}

const ThemeHistorySchema = new Schema<IThemeHistoryEntry>(
  {
    type: { type: String, enum: ["annual", "monthly", "semester"], required: true },
    label: { type: String, required: true },
    theme: { type: String, required: true },
    scripture: { type: String },
    archivedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: "main", unique: true },
    socialLinks: {
      facebook: String,
      instagram: String,
      tiktok: String,
      whatsapp: String,
    },
    customSocialLinks: [
      {
        platform: { type: String, default: "" },
        label: { type: String, default: "" },
        url: { type: String, default: "" },
        _id: false,
      },
    ],
    annualTheme: {
      year: Number,
      theme: String,
      scripture: String,
    },
    monthlyThemes: [
      {
        month: { type: Number, min: 1, max: 12 },
        year: Number,
        theme: String,
        _id: false,
      },
    ],
    semesterThemes: [
      {
        semester: { type: Number, min: 1, max: 2 },
        year: Number,
        theme: String,
        _id: false,
      },
    ],
    themeHistory: [ThemeHistorySchema],
  },
  { timestamps: true }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
