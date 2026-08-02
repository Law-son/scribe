import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { GENDER_VALUES, MEMBERSHIP_VALUES, LEVEL_VALUES, DEPARTMENT_VALUES, RELATIONSHIP_VALUES } from "@/lib/userOptions";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(currentUser.sub).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    whatsapp: user.whatsapp ?? "",
    email: user.email ?? "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : "",
    role: user.role,
    totalPoints: user.totalPoints,
    membershipType: user.membershipType,
    programmeOfStudy: user.programmeOfStudy ?? "",
    level: user.level ?? "",
    location: user.location,
    departmentInChurch: user.departmentInChurch ?? "",
    emergencyContactName: user.emergencyContactName ?? "",
    emergencyContactPhone: user.emergencyContactPhone ?? "",
    emergencyContactRelationship: user.emergencyContactRelationship ?? "",
    gender: user.gender,
    isActive: user.isActive,
  });
}

const UpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  whatsapp: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(GENDER_VALUES).optional(),
  membershipType: z.enum(MEMBERSHIP_VALUES).optional(),
  programmeOfStudy: z.string().min(2).max(150).optional(),
  level: z.enum(LEVEL_VALUES).optional(),
  location: z.string().min(2).max(200).optional(),
  departmentInChurch: z.enum(DEPARTMENT_VALUES).optional(),
  emergencyContactName: z.string().min(2).max(100).optional(),
  emergencyContactPhone: z.string().min(7).max(20).optional(),
  emergencyContactRelationship: z.enum(RELATIONSHIP_VALUES).optional(),
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return phone;
}

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = currentUser.sub;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();

  const updates: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.phone) {
    const normalized = normalizePhone(parsed.data.phone);
    const conflict = await User.findOne({ phone: normalized, _id: { $ne: userId } }).lean();
    if (conflict) {
      return NextResponse.json({ error: "That phone number is already in use" }, { status: 409 });
    }
    updates.phone = normalized;
  }

  if (parsed.data.whatsapp) {
    updates.whatsapp = normalizePhone(parsed.data.whatsapp);
  }

  if (parsed.data.emergencyContactPhone) {
    updates.emergencyContactPhone = normalizePhone(parsed.data.emergencyContactPhone);
  }

  if (parsed.data.email) {
    const normalizedEmail = parsed.data.email.toLowerCase();
    const conflict = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } }).lean();
    if (conflict) {
      return NextResponse.json({ error: "That email address is already in use" }, { status: 409 });
    }
    updates.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    whatsapp: user.whatsapp ?? "",
    email: user.email ?? "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : "",
    gender: user.gender,
    membershipType: user.membershipType,
    programmeOfStudy: user.programmeOfStudy ?? "",
    level: user.level ?? "",
    location: user.location,
    departmentInChurch: user.departmentInChurch ?? "",
    emergencyContactName: user.emergencyContactName ?? "",
    emergencyContactPhone: user.emergencyContactPhone ?? "",
    emergencyContactRelationship: user.emergencyContactRelationship ?? "",
  });
}
