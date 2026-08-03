import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/logActivity";
import { parseRow, CSV_MAX_ROWS, type NormalizedRow } from "@/lib/csvImport";

const BodySchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(CSV_MAX_ROWS),
});

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

interface Failure {
  row: number;
  name?: string;
  phone?: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  const actor = await guard();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid request. A file can contain at most ${CSV_MAX_ROWS} rows.` },
      { status: 400 }
    );
  }

  const { rows } = parsed.data;
  await connectDB();

  const failures: Failure[] = [];
  const validRows: { rowNumber: number; data: NormalizedRow }[] = [];
  const seenPhones = new Map<string, number>();
  const seenEmails = new Map<string, number>();

  rows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for 1-indexing, +1 for the header row
    const result = parseRow(rawRow, rowNumber);
    if (!result.ok) {
      failures.push({ row: rowNumber, reason: result.reason });
      return;
    }

    const { data } = result;

    if (seenPhones.has(data.phone)) {
      failures.push({
        row: rowNumber,
        name: data.name,
        phone: data.phone,
        reason: `Duplicate phone number in this file (already used by row ${seenPhones.get(data.phone)})`,
      });
      return;
    }
    seenPhones.set(data.phone, rowNumber);

    if (data.email) {
      if (seenEmails.has(data.email)) {
        delete data.email;
      } else {
        seenEmails.set(data.email, rowNumber);
      }
    }

    validRows.push({ rowNumber, data });
  });

  const phonesToCheck = validRows.map((r) => r.data.phone);
  const emailsToCheck = validRows
    .map((r) => r.data.email)
    .filter((e): e is string => !!e);

  const existing = phonesToCheck.length
    ? await User.find({
        $or: [
          { phone: { $in: phonesToCheck } },
          ...(emailsToCheck.length ? [{ email: { $in: emailsToCheck } }] : []),
        ],
      })
        .select("phone email")
        .lean()
    : [];

  const existingPhones = new Set(existing.map((u) => u.phone));
  const existingEmails = new Set(existing.map((u) => u.email).filter((e): e is string => !!e));

  let successCount = 0;

  for (const { rowNumber, data } of validRows) {
    if (existingPhones.has(data.phone)) {
      failures.push({ row: rowNumber, name: data.name, phone: data.phone, reason: "Phone number already exists" });
      continue;
    }
    if (data.email && existingEmails.has(data.email)) {
      delete data.email;
    }

    try {
      const randomPassword = crypto.randomBytes(12).toString("base64url");
      const hashedPassword = await bcrypt.hash(randomPassword, 12);
      await User.create({
        ...data,
        password: hashedPassword,
        role: "member",
        isActive: true,
      });
      successCount++;
    } catch (err) {
      failures.push({
        row: rowNumber,
        name: data.name,
        phone: data.phone,
        reason: err instanceof Error ? err.message : "Unknown error creating this member",
      });
    }
  }

  logActivity({
    actorId: actor.sub,
    actorName: actor.name,
    action: `Bulk imported ${successCount} member${successCount === 1 ? "" : "s"} (${failures.length} failed)`,
    targetType: "user",
    metadata: { total: rows.length, successCount, failCount: failures.length },
  });

  return NextResponse.json({
    total: rows.length,
    successCount,
    failCount: failures.length,
    failures,
  });
}
