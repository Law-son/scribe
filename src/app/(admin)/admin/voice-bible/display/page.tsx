"use client";

import { useEffect, useState } from "react";
import { VOICE_BIBLE_CHANNEL, type VoiceBibleDisplayMessage } from "@/lib/voiceBibleChannel";

export default function VoiceBibleDisplayPage() {
  const [message, setMessage] = useState<VoiceBibleDisplayMessage | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(VOICE_BIBLE_CHANNEL);
    channel.onmessage = (event) => setMessage(event.data as VoiceBibleDisplayMessage);
    channel.postMessage({ type: "display-ready" });
    return () => channel.close();
  }, []);

  const ready = message && message.status !== "empty";

  return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center px-6 sm:px-16">
      {!ready ? (
        <p className="text-navy-dark/30 font-body text-center max-w-md">
          Waiting for a verse to be looked up from the control window…
        </p>
      ) : (
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-navy-dark text-lg sm:text-xl font-body font-bold uppercase tracking-[0.2em] mb-6">
            {message!.book} {message!.chapter}:{message!.verse} ({message!.translation})
          </p>
          {message!.status === "loading" ? (
            <p className="text-navy-dark/40 text-xl font-body italic">Loading…</p>
          ) : (
            <p className="font-heading text-navy-dark font-bold text-4xl sm:text-6xl leading-relaxed italic">
              &ldquo;{message!.text}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
