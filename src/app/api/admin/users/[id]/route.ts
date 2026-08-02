import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/logActivity";
import { GENDER_VALUES, MEMBERSHIP_VALUES, LEVEL_VALUES, DEPARTMENT_VALUES, RELATIONSHIP_VALUES } from "@/lib/userOptions";

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["member", "admin"]).optional(),
  isActive: z.boolean().optional(),
  gender: z.enum(GENDER_VALUES).optional(),
  phone: z.string().min(7).max(20).optional(),
  whatsapp: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.coerce.date().optional(),
  isStudent: z.boolean().optional(),
  programmeOfStudy: z.string().min(2).max(150).optional(),
  level: z.enum(LEVEL_VALUES).optional(),
  location: z.string().optional(),
  membershipType: z.enum(MEMBERSHIP_VALUES).optional(),
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

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const user = await User.findById(id).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...user, id: user._id.toString(), _id: undefined });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await guard();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();

  const updates: Record<string, unknown> = { ...parsed.data };
  const unset: Record<string, ""> = {};

  if (parsed.data.isStudent === false) {
    delete updates.programmeOfStudy;
    delete updates.level;
    unset.programmeOfStudy = "";
    unset.level = "";
  }

  if (parsed.data.phone) {
    const normalized = normalizePhone(parsed.data.phone);
    const conflict = await User.findOne({ phone: normalized, _id: { $ne: id } }).lean();
    if (conflict) return NextResponse.json({ error: "That phone number is already in use" }, { status: 409 });
    updates.phone = normalized;
  }
  if (parsed.data.whatsapp) updates.whatsapp = normalizePhone(parsed.data.whatsapp);
  if (parsed.data.emergencyContactPhone) updates.emergencyContactPhone = normalizePhone(parsed.data.emergencyContactPhone);
  if (parsed.data.email) {
    const normalizedEmail = parsed.data.email.toLowerCase();
    const conflict = await User.findOne({ email: normalizedEmail, _id: { $ne: id } }).lean();
    if (conflict) return NextResponse.json({ error: "That email address is already in use" }, { status: 409 });
    updates.email = normalizedEmail;
  }

  const updateOp: Record<string, unknown> = { $set: updates };
  if (Object.keys(unset).length) updateOp.$unset = unset;

  const before = await User.findById(id).select("name role isActive").lean();
  const user = await User.findByIdAndUpdate(id, updateOp, { new: true }).select("-password");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const changes = parsed.data;
  let action = "Updated member profile";
  if (changes.role && before && changes.role !== before.role) {
    action = changes.role === "admin"
      ? `Promoted ${user.name} to Admin`
      : `Demoted ${user.name} to Member`;
  } else if (changes.isActive !== undefined && before && changes.isActive !== before.isActive) {
    action = changes.isActive ? `Reactivated account for ${user.name}` : `Suspended account for ${user.name}`;
  } else {
    action = `Updated profile for ${user.name}`;
  }

  logActivity({
    actorId: actor.sub,
    actorName: actor.name,
    action,
    targetType: "user",
    targetId: id,
    targetLabel: user.name,
    metadata: changes,
  });

  return NextResponse.json({ id: user._id.toString() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await guard();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  if (id === actor.sub) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndDelete(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logActivity({
    actorId: actor.sub,
    actorName: actor.name,
    action: `Deleted member ${user.name}`,
    targetType: "user",
    targetId: id,
    targetLabel: user.name,
  });

  return NextResponse.json({ ok: true });
}
