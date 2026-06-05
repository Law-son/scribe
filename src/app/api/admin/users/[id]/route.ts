import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/logActivity";

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["member", "admin"]).optional(),
  isActive: z.boolean().optional(),
  location: z.string().optional(),
  membershipType: z.enum(["member", "visitor", "invitee", "convert"]).optional(),
});

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
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const before = await User.findById(id).select("name role isActive").lean();
  const user = await User.findByIdAndUpdate(id, parsed.data, { new: true }).select("-password");
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
