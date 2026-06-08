"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { TRANSLATIONS, DEFAULT_TRANSLATION, parseSpokenReference } from "@/lib/bibleBooks";

interface Verse {
  verse: number;
  text: string;
}

type Status = "idle" | "listening" | "looking-up" | "found" | "not-found" | "unsupported" | "error";

export function VoiceVerseLookup() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const [reference, setReference] = useState<{ book: string; chapter: number; verse: number } | null>(null);
  const [verseText, setVerseText] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const translationRef = useRef(translation);
  translationRef.current = translation;

  const lookup = useCallback(async (heard: string) => {
    const parsed = parseSpokenReference(heard);
    if (!parsed) {
      setStatus("not-found");
      setReference(null);
      setVerseText(null);
      return;
    }

    setReference({ book: parsed.book.name, chapter: parsed.chapter, verse: parsed.verse });
    setStatus("looking-up");

    try {
      const res = await fetch(
        `/api/bible/chapter?translation=${translationRef.current}&book=${parsed.book.id}&chapter=${parsed.chapter}`
      );
      const data = await res.json();
      const verses: Verse[] = data.verses ?? [];
      const match = verses.find((v) => v.verse === parsed.verse);
      if (match) {
        setVerseText(match.text);
        setStatus("found");
      } else {
        setVerseText(null);
        setStatus("not-found");
      }
    } catch {
      setVerseText(null);
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }

    setTranscript("");
    setReference(null);
    setVerseText(null);

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      const heard = (finalText || interimText).trim();
      setTranscript(heard);
      if (finalText.trim()) lookup(finalText.trim());
    };

    recognition.onerror = () => setStatus("error");
    recognition.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lookup]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const isListening = status === "listening";

  return (
    <div className="bg-white border border-cream-dark rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col items-center text-center gap-4">
        <button
          onClick={isListening ? stop : start}
          disabled={status === "looking-up"}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-colors disabled:opacity-50 ${
            isListening ? "bg-burgundy text-white" : "bg-navy text-cream hover:bg-navy-light"
          }`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening && <span className="absolute inset-0 rounded-full bg-burgundy animate-ping opacity-30" />}
          {isListening ? <Square size={24} /> : <Mic size={28} />}
        </button>

        <p className="text-sm font-body text-navy/60">
          {status === "idle" && "Tap the mic, then say a verse reference — e.g. “John chapter 3 verse 16”."}
          {status === "listening" && "Listening… speak the reference now."}
          {status === "looking-up" && "Looking up the verse…"}
          {status === "found" && "Here's what was found:"}
          {status === "not-found" && "Couldn't match that to a verse. Try again, e.g. “Romans 8 28”."}
          {status === "unsupported" && "Voice recognition isn't supported in this browser. Try Chrome on desktop or Android."}
          {status === "error" && "Something went wrong with voice recognition. Please try again."}
        </p>

        {transcript && (
          <p className="text-xs font-body text-navy/40 italic">Heard: “{transcript}”</p>
        )}

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-navy/50 font-body">Translation:</span>
          {TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTranslation(t.id)}
              className={`text-xs px-2.5 py-1 rounded-full font-body transition-colors ${
                translation === t.id ? "bg-navy text-cream" : "bg-cream text-navy/60 hover:text-navy"
              }`}
            >
              {t.id}
            </button>
          ))}
        </div>
      </div>

      {reference && (
        <div className="mt-8 border-t border-cream-dark pt-6">
          <p className="text-gold-dark text-sm font-body font-semibold uppercase tracking-widest text-center mb-3">
            {reference.book} {reference.chapter}:{reference.verse} ({translation})
          </p>
          {status === "looking-up" ? (
            <p className="text-navy/40 text-sm font-body italic text-center">Loading…</p>
          ) : verseText ? (
            <p className="font-heading text-navy-dark text-2xl leading-relaxed italic text-center">
              &ldquo;{verseText}&rdquo;
            </p>
          ) : (
            <p className="text-navy/40 text-sm font-body text-center">Verse text not found for that reference.</p>
          )}
        </div>
      )}
    </div>
  );
}
