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

type CompletionCheckable = Partial<Record<(typeof REQUIRED_FOR_COMPLETION)[number], unknown>>;

export function isProfileComplete(user: CompletionCheckable): boolean {
  return REQUIRED_FOR_COMPLETION.every((field) => {
    const value = user[field];
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  });
}
