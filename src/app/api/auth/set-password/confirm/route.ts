import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import OtpVerification from "@/models/OtpVerification";

const Schema = z.object({
  resetToken: z.string().min(1),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();

  const otp = await OtpVerification.findOne({
    resetToken: parsed.data.resetToken,
    verified: true,
    expiresAt: { $gt: new Date() },
  });
  if (!otp) {
    return NextResponse.json({ error: "This session has expired. Please start again." }, { status: 400 });
  }

  const user = await User.findOne({ phone: otp.phone }).select("+password");
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  user.password = await bcrypt.hash(parsed.data.password, 12);
  await user.save();

  await OtpVerification.deleteOne({ _id: otp._id });

  return NextResponse.json({ ok: true });
}
