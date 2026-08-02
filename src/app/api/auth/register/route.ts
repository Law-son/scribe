import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import { awardPoints } from "@/lib/points";
import { GENDER_VALUES, MEMBERSHIP_VALUES, LEVEL_VALUES, DEPARTMENT_VALUES, RELATIONSHIP_VALUES } from "@/lib/userOptions";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  whatsapp: z.string().min(7).max(20),
  email: z.string().email(),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(GENDER_VALUES),
  membershipType: z.enum(MEMBERSHIP_VALUES),
  isStudent: z.boolean().default(true),
  programmeOfStudy: z.string().min(2).max(150).optional(),
  level: z.enum(LEVEL_VALUES).optional(),
  location: z.string().min(2).max(200),
  departmentInChurch: z.enum(DEPARTMENT_VALUES),
  emergencyContactName: z.string().min(2).max(100),
  emergencyContactPhone: z.string().min(7).max(20),
  emergencyContactRelationship: z.enum(RELATIONSHIP_VALUES),
  password: z.string().min(6).max(100),
  referredBy: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isStudent) return;
  if (!data.programmeOfStudy || data.programmeOfStudy.trim().length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["programmeOfStudy"], message: "Programme of Study is required" });
  }
  if (!data.level) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["level"], message: "Level / Year is required" });
  }
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    return "0" + digits.slice(3);
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return digits;
  }
  return phone;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name, phone, whatsapp, email, dateOfBirth, gender, membershipType, isStudent,
      programmeOfStudy, level, location, departmentInChurch,
      emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
      password, referredBy,
    } = parsed.data;

    await connectDB();

    const normalizedPhone = normalizePhone(phone);
    const existing = await User.findOne({
      $or: [{ phone: normalizedPhone }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.phone === normalizedPhone
              ? "An account with this phone number already exists"
              : "An account with this email address already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      phone: normalizedPhone,
      whatsapp: normalizePhone(whatsapp),
      email: email.toLowerCase(),
      dateOfBirth,
      gender,
      membershipType,
      isStudent,
      programmeOfStudy: isStudent ? programmeOfStudy : undefined,
      level: isStudent ? level : undefined,
      location,
      departmentInChurch,
      emergencyContactName,
      emergencyContactPhone: normalizePhone(emergencyContactPhone),
      emergencyContactRelationship,
      password: hashedPassword,
      role: "member",
      referredBy: referredBy || undefined,
    });

    sendSMS(
      [normalizedPhone],
      `Welcome to UCM Scribe, ${name}! Your account has been created. Explore sermons, Bible study notes, devotionals, and more. God bless you!`
    ).catch((err) => console.error("[Auth/Register] Welcome SMS failed:", err));

    // Award referrer +15 points when a convert registers and selects them
    if (membershipType === "convert" && referredBy) {
      awardPoints({ userId: referredBy, action: "register_convert", contentId: user._id.toString() })
        .catch((err) => console.error("[Auth/Register] Referrer points failed:", err));
    }

    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        totalPoints: user.totalPoints,
      },
    });
  } catch (err) {
    console.error("[Auth/Register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
