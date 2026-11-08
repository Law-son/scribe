// Agoo SMS API — https://api.agoosms.com
// - POST /v1/sms/send       → single recipient (sendSMS)
// - POST /v1/sms/send-bulk  → up to 1,000 recipients per call (broadcastWithProgress)
const AGOO_API_URL = process.env.AGOO_API_URL || "https://api.agoosms.com";
const BULK_CHUNK_SIZE = 1000; // API max recipients per bulk call
const MAX_RETRIES = 2; // up to 2 extra attempts after the first
const MAX_MESSAGE_LENGTH = 480;

/**
 * Normalise to E.164 (+233XXXXXXXXX). Returns null for numbers the API
 * would reject (a single invalid number rejects an entire bulk request).
 */
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return "+233" + digits.slice(1);
  if (digits.length === 12 && digits.startsWith("233")) return "+" + digits;
  if (phone.trim().startsWith("+") && digits.length >= 8 && digits.length <= 15) return "+" + digits;
  return null;
}

interface AgooResult {
  ok: boolean;
  /** Worth retrying (network error, 429, 5xx) */
  retryable: boolean;
}

async function agooPost(path: string, body: Record<string, unknown>): Promise<AgooResult> {
  const apiKey = process.env.AGOO_API_KEY;
  const senderId = process.env.AGOO_SENDER_ID;
  if (!apiKey || !senderId) {
    console.warn("[SMS] AGOO_API_KEY / AGOO_SENDER_ID not configured — skipping send");
    return { ok: true, retryable: false }; // treat as success so we don't retry forever
  }

  try {
    const res = await fetch(`${AGOO_API_URL}${path}`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, senderId }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, retryable: false };

    console.error("[SMS] Agoo error:", res.status, data?.error ?? data);
    return { ok: false, retryable: res.status === 429 || res.status >= 500 };
  } catch (err) {
    console.error("[SMS] Agoo request failed:", err);
    return { ok: false, retryable: true };
  }
}

/** POST /v1/sms/send — one message to one recipient. */
async function sendSingle(to: string, message: string): Promise<boolean> {
  const number = toE164(to);
  if (!number) {
    console.error("[SMS] Invalid phone number, skipping:", to);
    return false;
  }
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const r = await agooPost("/v1/sms/send", { to: number, message: message.slice(0, MAX_MESSAGE_LENGTH) });
    if (r.ok) return true;
    if (!r.retryable) return false;
    await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
  }
  return false;
}

/**
 * Send one-off SMS messages (OTP codes, welcome messages, notifications) via
 * the single-send endpoint. Errors are logged, never thrown.
 */
export async function sendSMS(to: string[], message: string): Promise<void> {
  for (const phone of to) {
    await sendSingle(phone, message);
  }
}

/** POST /v1/sms/send-bulk — same message to up to 1,000 recipients. */
async function sendBulkChunk(numbers: string[], message: string): Promise<boolean> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const r = await agooPost("/v1/sms/send-bulk", {
      recipients: numbers,
      message: message.slice(0, MAX_MESSAGE_LENGTH),
    });
    if (r.ok) return true;
    if (!r.retryable) return false;
    console.log(`[SMS] Bulk retry ${attempt + 1} for ${numbers.length} numbers`);
    // Bulk is limited to 10 requests/min — back off generously on retry
    await new Promise((res) => setTimeout(res, 7000 * (attempt + 1)));
  }
  return false;
}

export interface SmsBroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

/**
 * Broadcast a message to many numbers via the bulk endpoint (1,000 per call).
 * "sent" means accepted by the provider; per-recipient delivery can be checked
 * later via GET /v1/sms/:id. Reports progress after every chunk.
 */
export async function broadcastWithProgress(
  numbers: string[],
  message: string,
  onProgress: (sent: number, failed: number) => Promise<void>
): Promise<SmsBroadcastResult> {
  // Normalise + dedupe; invalid numbers would reject the whole bulk request
  const valid = new Set<string>();
  let invalid = 0;
  for (const n of numbers) {
    const e164 = toE164(n);
    if (e164) valid.add(e164);
    else invalid++;
  }
  const unique = [...valid];
  if (invalid > 0) console.warn(`[SMS] Skipping ${invalid} invalid phone numbers`);

  let sent = 0;
  let failed = invalid;
  if (invalid > 0) await onProgress(sent, failed);

  for (let i = 0; i < unique.length; i += BULK_CHUNK_SIZE) {
    const chunk = unique.slice(i, i + BULK_CHUNK_SIZE);
    if (await sendBulkChunk(chunk, message)) sent += chunk.length;
    else failed += chunk.length;

    await onProgress(sent, failed);

    // Stay under the 10 requests/minute bulk rate limit
    if (i + BULK_CHUNK_SIZE < unique.length) await new Promise((r) => setTimeout(r, 6500));
  }

  console.log(`[SMS] Broadcast complete — sent: ${sent}, failed: ${failed}`);
  return { total: numbers.length, sent, failed };
}

/**
 * Simple broadcast — no progress tracking. Used for non-announcement sends
 * (sermons, bible studies, devotionals).
 */
export async function broadcastToAllMembers(message: string): Promise<void> {
  try {
    const { default: connectDB } = await import("./db");
    const { default: User } = await import("@/models/User");
    await connectDB();

    const users = await User.find({ isActive: true }).select("phone").lean();
    const numbers = users.map((u) => u.phone).filter(Boolean) as string[];
    if (numbers.length === 0) return;

    await broadcastWithProgress(numbers, message, async () => {});
  } catch (err) {
    console.error("[SMS] Broadcast failed:", err);
  }
}

export const SMS_TEMPLATES = {
  sermon: (title: string, url: string) =>
    `New sermon: "${title}" is now available. Read here: ${url}`,
  bibleStudy: (url: string) =>
    `New Bible Study Notes are available. Access them here: ${url}`,
  devotional: (url: string) =>
    `Today's devotional is ready. Read here: ${url}`,
  announcement: (title: string, body: string) => `${title}\n${body}`,
  quote: (text: string, author: string, url: string) =>
    `"${text}"\n— ${author}\n${url}`,
};
