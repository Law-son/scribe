// Arkesel v1 SMS API — GET with query params
const ARKESEL_API_URL = "https://sms.arkesel.com/sms/api";

function toArkeselNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return "233" + digits.slice(1);
  }
  if (digits.startsWith("233") && digits.length === 12) {
    return digits;
  }
  return digits;
}

export async function sendSMS(to: string[], message: string): Promise<void> {
  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) {
    console.warn("[SMS] ARKESEL_API_KEY not configured — skipping send");
    return;
  }

  const BATCH_SIZE = 100;

  for (let i = 0; i < to.length; i += BATCH_SIZE) {
    const batch = to.slice(i, i + BATCH_SIZE).map(toArkeselNumber).join(",");

    try {
      const params = new URLSearchParams({
        action: "send-sms",
        api_key: apiKey,
        to: batch,
        from: process.env.ARKESEL_SENDER_ID || "UCM Scribe",
        sms: message,
      });

      const res = await fetch(`${ARKESEL_API_URL}?${params.toString()}`);
      const data = await res.json();

      if (data?.code !== "ok") {
        console.error("[SMS] Arkesel error:", data);
      }
    } catch (err) {
      console.error("[SMS] Send failed:", err);
    }

    if (i + BATCH_SIZE < to.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function broadcastToAllMembers(message: string): Promise<void> {
  try {
    const { default: connectDB } = await import("./db");
    const { default: User } = await import("@/models/User");
    await connectDB();

    const users = await User.find({ isActive: true }).select("phone").lean();
    const numbers = users.map((u) => u.phone).filter(Boolean);
    if (numbers.length === 0) return;

    await sendSMS(numbers, message);
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
