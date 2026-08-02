import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profileCompletion";

const LoginSchema = z.object({
  phone: z.string().min(7),
  password: z.string().min(1),
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
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { phone, password } = parsed.data;
    await connectDB();

    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({ phone: normalizedPhone }).select("+password");

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

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
        profileComplete: isProfileComplete(user),
      },
    });
  } catch (err) {
    console.error("[Auth/Login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
