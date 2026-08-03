import { normalizePhone } from "@/lib/phone";
import { GENDER_OPTIONS, MEMBERSHIP_OPTIONS, LEVEL_OPTIONS, DEPARTMENT_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/userOptions";

// Fixed, documented column headers for the bulk member-import CSV.
// Name can be provided either as a single "Full Name" column, or split across
// "First Name" / "Last Name" / "Other Names" — both are combined into one `name` value.
export const CSV_HEADERS = {
  fullName: "Full Name",
  firstName: "First Name",
  lastName: "Last Name",
  otherNames: "Other Names",
  phone: "Phone Number",
  gender: "Gender",
  location: "Location/Name of Hostel",
  whatsapp: "WhatsApp Number",
  email: "Email Address",
  dateOfBirth: "Date of Birth",
  membershipType: "Membership Type",
  isStudent: "Is Student",
  programmeOfStudy: "Programme of Study",
  level: "Level/Year",
  departmentInChurch: "Department in the Church",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactPhone: "Emergency Contact Number",
  emergencyContactRelationship: "Relationship to Emergency Contact",
} as const;

export interface CsvFieldInfo {
  header: string;
  required: boolean;
  hint?: string;
}

// Drives both the instructions table on the import page and the downloadable template.
export const CSV_FIELD_INFO: CsvFieldInfo[] = [
  { header: CSV_HEADERS.fullName, required: true, hint: "Or use First Name / Last Name / Other Names instead" },
  { header: CSV_HEADERS.phone, required: true, hint: "e.g. 0244000000 — used to identify members and skip duplicates" },
  { header: CSV_HEADERS.gender, required: true, hint: "Male / Female / Other" },
  { header: CSV_HEADERS.location, required: true },
  { header: CSV_HEADERS.whatsapp, required: false },
  { header: CSV_HEADERS.email, required: false },
  { header: CSV_HEADERS.dateOfBirth, required: false, hint: "YYYY-MM-DD" },
  { header: CSV_HEADERS.membershipType, required: false, hint: "Member / Visitor / Invitee / New Convert (default: Member)" },
  { header: CSV_HEADERS.isStudent, required: false, hint: "Yes / No (default: Yes)" },
  { header: CSV_HEADERS.programmeOfStudy, required: false },
  { header: CSV_HEADERS.level, required: false, hint: "Year 1 – Year 4" },
  { header: CSV_HEADERS.departmentInChurch, required: false, hint: "Choir / Media / Evangelism / Ushering / Prayer / Hospitality / Protocol / Other" },
  { header: CSV_HEADERS.emergencyContactName, required: false },
  { header: CSV_HEADERS.emergencyContactPhone, required: false },
  { header: CSV_HEADERS.emergencyContactRelationship, required: false, hint: "Mother / Father / Sister / Brother / Guardian / Friend / Other" },
];

export const CSV_MAX_ROWS = 1000;

export interface NormalizedRow {
  name: string;
  phone: string;
  gender: string;
  location: string;
  isStudent: boolean;
  whatsapp?: string;
  email?: string;
  dateOfBirth?: Date;
  membershipType?: string;
  programmeOfStudy?: string;
  level?: string;
  departmentInChurch?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export type CsvRowResult =
  | { ok: true; data: NormalizedRow }
  | { ok: false; reason: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRowKeys(rawRow: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawRow)) {
    out[key.trim().toLowerCase()] = typeof val === "string" ? val : String(val ?? "");
  }
  return out;
}

function matchOption(options: { value: string; label: string }[], raw?: string): string | undefined {
  const norm = raw?.trim().toLowerCase();
  if (!norm) return undefined;
  return options.find((o) => o.value.toLowerCase() === norm || o.label.toLowerCase() === norm)?.value;
}

function parseGender(raw?: string): string | undefined {
  const norm = raw?.trim().toLowerCase();
  if (!norm) return undefined;
  if (norm === "m") return "male";
  if (norm === "f") return "female";
  return matchOption(GENDER_OPTIONS, raw);
}

function parseLevel(raw?: string): string | undefined {
  const norm = raw?.trim();
  if (!norm) return undefined;
  if (["1", "2", "3", "4"].includes(norm)) return `year_${norm}`;
  return matchOption(LEVEL_OPTIONS, raw);
}

function parseIsStudent(raw?: string): boolean {
  const norm = raw?.trim().toLowerCase();
  if (!norm) return true;
  if (["no", "n", "false", "0"].includes(norm)) return false;
  return true;
}

function parseEmail(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return EMAIL_RE.test(trimmed) ? trimmed.toLowerCase() : undefined;
}

function parseDate(raw?: string): Date | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function resolveName(row: Record<string, string>): string | null {
  const full = row[CSV_HEADERS.fullName.toLowerCase()]?.trim();
  if (full) return full;
  const first = row[CSV_HEADERS.firstName.toLowerCase()]?.trim() ?? "";
  const last = row[CSV_HEADERS.lastName.toLowerCase()]?.trim() ?? "";
  const other = row[CSV_HEADERS.otherNames.toLowerCase()]?.trim() ?? "";
  const combined = [first, other, last].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return combined || null;
}

/**
 * Validates and normalizes one raw CSV row (header -> cell value, as produced by
 * client-side parsing) into a User-creatable shape. Hard-required fields (name,
 * phone, gender, location) fail the row if missing or unrecognized; everything
 * else is best-effort — an invalid/unrecognized optional value is simply left
 * out rather than failing the row.
 */
export function parseRow(rawRow: Record<string, string>, rowNumber: number): CsvRowResult {
  const row = normalizeRowKeys(rawRow);
  const get = (header: string) => row[header.toLowerCase()];

  const name = resolveName(row);
  if (!name) {
    return { ok: false, reason: `Row ${rowNumber}: missing required field 'Full Name' (or First/Last Name)` };
  }

  const rawPhone = get(CSV_HEADERS.phone)?.trim();
  if (!rawPhone) {
    return { ok: false, reason: `Row ${rowNumber}: missing required field 'Phone Number'` };
  }
  const phone = normalizePhone(rawPhone);
  if (!/^0\d{9}$/.test(phone)) {
    return { ok: false, reason: `Row ${rowNumber}: invalid phone number '${rawPhone}'` };
  }

  const rawGender = get(CSV_HEADERS.gender);
  const gender = parseGender(rawGender);
  if (!gender) {
    return {
      ok: false,
      reason: `Row ${rowNumber}: missing or unrecognized 'Gender' value${rawGender?.trim() ? ` ('${rawGender.trim()}')` : ""}`,
    };
  }

  const rawLocation = get(CSV_HEADERS.location)?.trim();
  if (!rawLocation) {
    return { ok: false, reason: `Row ${rowNumber}: missing required field 'Location/Name of Hostel'` };
  }

  const isStudent = parseIsStudent(get(CSV_HEADERS.isStudent));

  const data: NormalizedRow = { name, phone, gender, location: rawLocation, isStudent };

  const whatsapp = get(CSV_HEADERS.whatsapp)?.trim();
  if (whatsapp) data.whatsapp = normalizePhone(whatsapp);

  const email = parseEmail(get(CSV_HEADERS.email));
  if (email) data.email = email;

  const dateOfBirth = parseDate(get(CSV_HEADERS.dateOfBirth));
  if (dateOfBirth) data.dateOfBirth = dateOfBirth;

  const membershipType = matchOption(MEMBERSHIP_OPTIONS, get(CSV_HEADERS.membershipType));
  if (membershipType) data.membershipType = membershipType;

  if (isStudent) {
    const programmeOfStudy = get(CSV_HEADERS.programmeOfStudy)?.trim();
    if (programmeOfStudy) data.programmeOfStudy = programmeOfStudy;
    const level = parseLevel(get(CSV_HEADERS.level));
    if (level) data.level = level;
  }

  const departmentInChurch = matchOption(DEPARTMENT_OPTIONS, get(CSV_HEADERS.departmentInChurch));
  if (departmentInChurch) data.departmentInChurch = departmentInChurch;

  const emergencyContactName = get(CSV_HEADERS.emergencyContactName)?.trim();
  if (emergencyContactName) data.emergencyContactName = emergencyContactName;

  const emergencyContactPhoneRaw = get(CSV_HEADERS.emergencyContactPhone)?.trim();
  if (emergencyContactPhoneRaw) data.emergencyContactPhone = normalizePhone(emergencyContactPhoneRaw);

  const emergencyContactRelationship = matchOption(RELATIONSHIP_OPTIONS, get(CSV_HEADERS.emergencyContactRelationship));
  if (emergencyContactRelationship) data.emergencyContactRelationship = emergencyContactRelationship;

  return { ok: true, data };
}
