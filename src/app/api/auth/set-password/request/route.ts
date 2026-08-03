import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import OtpVerification from "@/models/OtpVerification";
import { sendSMS } from "@/lib/sms";
import { normalizePhone } from "@/lib/phone";

const Schema = z.object({ phone: z.string().min(7) });

const COOLDOWN_MS = 60 * 1000;
const EXPIRY_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

  await connectDB();
  const phone = normalizePhone(parsed.data.phone);

  // Unlike forgot-password, this flow explicitly confirms account existence —
  // the user needs to know whether their number is registered at all.
  const user = await User.findOne({ phone }).select("isActive").lean();
  if (!user) {
    return NextResponse.json({ error: "No account found with that phone number" }, { status: 404 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "This account has been suspended. Contact an admin." }, { status: 403 });
  }

  const recent = await OtpVerification.findOne({ phone }).sort({ createdAt: -1 }).lean();
  if (recent && Date.now() - new Date(recent.createdAt).getTime() < COOLDOWN_MS) {
    return NextResponse.json({ error: "Please wait a moment before requesting another code." }, { status: 429 });
  }

  // Only one active code per phone at a time.
  await OtpVerification.deleteMany({ phone });

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await OtpVerification.create({ phone, codeHash, expiresAt, attempts: 0, verified: false });

  await sendSMS([phone], `Your UCM Scribe verification code is ${code}. It expires in 10 minutes.`);

  return NextResponse.json({ ok: true });
}
