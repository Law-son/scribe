"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { VOICE_BIBLE_CHANNEL, TEXT_SIZE_PRESETS, DEFAULT_TEXT_SIZE, type VoiceBibleDisplayMessage } from "@/lib/voiceBibleChannel";

// Floor for the auto-fit search below — small enough that even a long
// verse always finds a size that fits without scrolling.
const MIN_FONT_SIZE = 16;

export default function VoiceBibleDisplayPage() {
  const [message, setMessage] = useState<VoiceBibleDisplayMessage | null>(null);
  const [fontSize, setFontSize] = useState(TEXT_SIZE_PRESETS[DEFAULT_TEXT_SIZE]);

  const boundsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(VOICE_BIBLE_CHANNEL);
    channel.onmessage = (event) => setMessage(event.data as VoiceBibleDisplayMessage);
    channel.postMessage({ type: "display-ready" });
    return () => channel.close();
  }, []);

  const ready = message && message.status !== "empty";
  const showingText = ready && message!.status !== "loading";
  const maxFontSize = TEXT_SIZE_PRESETS[message?.textSize ?? DEFAULT_TEXT_SIZE];

  // Binary-search the largest font size whose wrapped text still fits the
  // available height, so the verse never overflows into a scrollbar — it
  // only ever shrinks to cover the lines it has room for, still centered.
  useLayoutEffect(() => {
    if (!showingText) return;
    const bounds = boundsRef.current;
    const stage = stageRef.current;
    const verse = verseRef.current;
    if (!bounds || !stage || !verse) return;

    const fit = () => {
      const boundsStyle = window.getComputedStyle(bounds);
      const paddingY = parseFloat(boundsStyle.paddingTop) + parseFloat(boundsStyle.paddingBottom);
      const availableHeight = bounds.clientHeight - paddingY;

      let low = MIN_FONT_SIZE;
      let high = maxFontSize;
      let best = low;

      for (let i = 0; i < 10; i++) {
        const mid = (low + high) / 2;
        verse.style.fontSize = `${mid}px`;
        if (stage.scrollHeight <= availableHeight) {
          best = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      verse.style.fontSize = `${best}px`;
      setFontSize(best);
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [showingText, message?.text, message?.book, message?.chapter, message?.verse, message?.translation, maxFontSize]);

  return (
    <div
      ref={boundsRef}
      className="fixed inset-0 z-[200] bg-white flex items-center justify-center overflow-hidden px-6 sm:px-16 py-10 sm:py-16"
    >
      {!ready ? (
        <p className="text-navy-dark/30 font-body text-center max-w-md">
          Waiting for a verse to be looked up from the control window…
        </p>
      ) : (
        <div ref={stageRef} className="max-w-4xl w-full text-center">
          <p className="text-navy-dark text-lg sm:text-xl font-body font-bold uppercase tracking-[0.2em] mb-6">
            {message!.book} {message!.chapter}:{message!.verse} ({message!.translation})
          </p>
          {message!.status === "loading" ? (
            <p className="text-navy-dark/40 text-xl font-body italic">Loading…</p>
          ) : (
            <p
              ref={verseRef}
              className="font-heading text-navy-dark font-bold leading-relaxed italic"
              style={{ fontSize: `${fontSize}px` }}
            >
              &ldquo;{message!.text}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
