// Fields introduced after the original registration form shipped.
// Accounts created before then won't have these until they complete their profile.
const REQUIRED_FOR_COMPLETION = [
  "dateOfBirth",
  "whatsapp",
  "email",
  "programmeOfStudy",
  "level",
  "departmentInChurch",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelationship",
] as const;

// Skipped when the user has explicitly flagged themselves as not a student.
const STUDENT_ONLY_FIELDS = new Set(["programmeOfStudy", "level"]);

type CompletionCheckable = Partial<Record<(typeof REQUIRED_FOR_COMPLETION)[number], unknown>> & {
  isStudent?: boolean;
};

export function isProfileComplete(user: CompletionCheckable): boolean {
  return REQUIRED_FOR_COMPLETION.every((field) => {
    if (user.isStudent === false && STUDENT_ONLY_FIELDS.has(field)) return true;
    const value = user[field];
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  });
}
