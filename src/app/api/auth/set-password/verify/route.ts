import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import OtpVerification from "@/models/OtpVerification";
import { normalizePhone } from "@/lib/phone";

const Schema = z.object({ phone: z.string().min(7), code: z.string().length(6) });

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const phone = normalizePhone(parsed.data.phone);

  const otp = await OtpVerification.findOne({ phone, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!otp) {
    return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await OtpVerification.deleteOne({ _id: otp._id });
    return NextResponse.json({ error: "Too many incorrect attempts. Please request a new code." }, { status: 429 });
  }

  const valid = await bcrypt.compare(parsed.data.code, otp.codeHash);
  if (!valid) {
    otp.attempts += 1;
    await otp.save();
    const remaining = MAX_ATTEMPTS - otp.attempts;
    return NextResponse.json(
      { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
      { status: 400 }
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  otp.verified = true;
  otp.resetToken = resetToken;
  await otp.save();

  return NextResponse.json({ resetToken });
}
