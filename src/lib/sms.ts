// Arkesel v1 SMS API — GET with query params
const ARKESEL_API_URL = "https://sms.arkesel.com/sms/api";
const BATCH_SIZE = 10;
const MAX_RETRIES = 2; // up to 2 extra attempts after the first

function toArkeselNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "233" + digits.slice(1);
  if (digits.startsWith("233") && digits.length === 12) return digits;
  return digits;
}

/**
 * Send a one-off SMS to a specific list of numbers (used for welcome messages etc.).
 * Not batched or retried — keep it simple for single-user sends.
 */
export async function sendSMS(to: string[], message: string): Promise<void> {
  if (to.length === 0) return;
  await sendBatch(to, message);
}

/**
 * Send a single batch of numbers (≤10).
 * Returns the list of numbers that failed (empty = all succeeded).
 */
async function sendBatch(numbers: string[], message: string): Promise<string[]> {
  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) {
    console.warn("[SMS] ARKESEL_API_KEY not configured — skipping send");
    return []; // treat as success so we don't retry forever
  }

  const formatted = numbers.map(toArkeselNumber).join(",");
  try {
    const params = new URLSearchParams({
      action: "send-sms",
      api_key: apiKey,
      to: formatted,
      from: process.env.ARKESEL_SENDER_ID || "UCM Scribe",
      sms: message,
    });
    const res = await fetch(`${ARKESEL_API_URL}?${params.toString()}`);
    const data = await res.json();
    if (data?.code !== "ok") {
      console.error("[SMS] Arkesel error:", data);
      return numbers; // entire batch failed
    }
    return []; // entire batch succeeded
  } catch (err) {
    console.error("[SMS] Batch send failed:", err);
    return numbers; // entire batch failed
  }
}

export interface SmsBroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

/**
 * Broadcast a message to all numbers, with batches of 10 and up to 2 retries
 * for failed numbers. Updates announcement progress in DB after each batch.
 */
export async function broadcastWithProgress(
  numbers: string[],
  message: string,
  onProgress: (sent: number, failed: number) => Promise<void>
): Promise<SmsBroadcastResult> {
  let sent = 0;
  let pendingFailed = [...numbers];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (pendingFailed.length === 0) break;

    const currentRound = [...pendingFailed];
    pendingFailed = [];

    for (let i = 0; i < currentRound.length; i += BATCH_SIZE) {
      const batch = currentRound.slice(i, i + BATCH_SIZE);
      const batchFailed = await sendBatch(batch, message);
      const batchSent = batch.length - batchFailed.length;

      sent += batchSent;
      pendingFailed.push(...batchFailed);

      // Report progress after every batch
      await onProgress(sent, pendingFailed.length);

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < currentRound.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // Delay before retry round
    if (attempt < MAX_RETRIES && pendingFailed.length > 0) {
      console.log(`[SMS] Retry ${attempt + 1}: ${pendingFailed.length} numbers to retry`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const failed = pendingFailed.length;
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
