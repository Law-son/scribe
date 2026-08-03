// Normalizes Ghanaian phone numbers to local 0XXXXXXXXX format for storage/lookup.
// Accepts "233XXXXXXXXX" (international, 12 digits) or an already-local "0XXXXXXXXX" (10 digits).
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    return "0" + digits.slice(3);
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return digits;
  }
  return phone;
}
