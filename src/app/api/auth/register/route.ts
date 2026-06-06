import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import { awardPoints } from "@/lib/points";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  gender: z.enum(["male", "female"]),
  membershipType: z.enum(["member", "visitor", "invitee", "convert"]),
  location: z.string().min(2).max(200),
  password: z.string().min(6).max(100),
  referredBy: z.string().optional(),
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

    const { name, phone, gender, membershipType, location, password, referredBy } =
      parsed.data;

    await connectDB();

    const normalizedPhone = normalizePhone(phone);
    const existing = await User.findOne({ phone: normalizedPhone });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      phone: normalizedPhone,
      gender,
      membershipType,
      location,
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
