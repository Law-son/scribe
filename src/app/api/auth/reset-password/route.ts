import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { token, password } = parsed.data;

  await connectDB();

  const reset = await PasswordReset.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
  if (!reset) return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });

  const user = await User.findOne({ phone: reset.phone }).select("+password");
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const hashed = await bcrypt.hash(password, 12);
  user.password = hashed;
  await user.save();

  reset.used = true;
  await reset.save();

  return NextResponse.json({ ok: true });
}
