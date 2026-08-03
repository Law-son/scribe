import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { sendSMS } from "@/lib/sms";
import { normalizePhone } from "@/lib/phone";

const Schema = z.object({ phone: z.string().min(9) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

  await connectDB();

  const phone = normalizePhone(parsed.data.phone);
  const user = await User.findOne({ phone }).select("name phone").lean();

  // Always return success to prevent user enumeration
  if (!user) return NextResponse.json({ ok: true });

  // Invalidate old tokens for this phone
  await PasswordReset.deleteMany({ phone });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await PasswordReset.create({ phone, token, expiresAt });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").replace(/\/$/, "");
  const link = `${baseUrl}/reset-password?token=${token}`;

  await sendSMS(
    [phone],
    `Hello ${user.name}, here is your UCM Scribe password reset link (expires in 15 minutes): ${link}`
  );

  return NextResponse.json({ ok: true });
}
