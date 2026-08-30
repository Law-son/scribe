"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Mic, Square, MonitorPlay, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  BIBLE_BOOKS,
  TRANSLATIONS,
  DEFAULT_TRANSLATION,
  parseSpokenReference,
  stripVerseHtml,
  type BibleBook,
} from "@/lib/bibleBooks";
import {
  VOICE_BIBLE_CHANNEL,
  DEFAULT_TEXT_SIZE,
  type VoiceBibleDisplayMessage,
  type TextSizeId,
} from "@/lib/voiceBibleChannel";

const TEXT_SIZE_OPTIONS: { id: TextSizeId; label: string }[] = [
  { id: "sm", label: "S" },
  { id: "md", label: "M" },
  { id: "lg", label: "L" },
  { id: "xl", label: "XL" },
];

interface Verse {
  verse: number;
  text: string;
}

type Status = "idle" | "listening" | "looking-up" | "found" | "not-found" | "unsupported" | "error";

interface Position {
  book: BibleBook;
  chapter: number;
  verses: Verse[];
  index: number;
}

async function fetchChapter(translation: string, book: BibleBook, chapter: number): Promise<Verse[]> {
  const res = await fetch(`/api/bible/chapter?translation=${translation}&book=${book.id}&chapter=${chapter}`);
  const data = await res.json();
  const verses: Verse[] = data.verses ?? [];
  return verses.map((v) => ({ ...v, text: stripVerseHtml(v.text) }));
}

interface BookComboboxProps {
  value: BibleBook | null;
  onChange: (book: BibleBook) => void;
}

// Searchable book select — type to filter, click or arrow keys + Enter to pick.
function BookCombobox({ value, onChange }: BookComboboxProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = query.trim()
    ? BIBLE_BOOKS.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase()))
    : BIBLE_BOOKS;

  function select(book: BibleBook) {
    onChange(book);
    setQuery(book.name);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) select(filtered[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-navy/30 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search book…"
          className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body pl-8 pr-3 py-1.5 focus:outline-none focus:border-navy/40"
        />
      </div>
      {open && (
        <ul className="absolute z-20 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-cream-dark rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-navy/40 font-body italic">No books match</li>
          ) : (
            filtered.map((b, i) => (
              <li key={b.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(b)}
                  className={`w-full text-left px-3 py-1.5 text-sm font-body transition-colors ${
                    i === highlight ? "bg-cream text-navy" : "text-navy/70 hover:bg-cream"
                  }`}
                >
                  {b.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function VoiceVerseLookup() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const [position, setPosition] = useState<Position | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [textSize, setTextSize] = useState<TextSizeId>(DEFAULT_TEXT_SIZE);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualBook, setManualBook] = useState<BibleBook | null>(null);
  const [manualChapterStr, setManualChapterStr] = useState("");
  const [manualVerseStr, setManualVerseStr] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const translationRef = useRef(translation);
  translationRef.current = translation;

  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastMessageRef = useRef<VoiceBibleDisplayMessage | null>(null);

  const getChannel = useCallback((): BroadcastChannel | null => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
    if (!channelRef.current) {
      const channel = new BroadcastChannel(VOICE_BIBLE_CHANNEL);
      // Re-send the latest verse when a display window opens after lookup
      channel.onmessage = (event) => {
        if (event.data?.type === "display-ready" && lastMessageRef.current) {
          channel.postMessage(lastMessageRef.current);
        }
      };
      channelRef.current = channel;
    }
    return channelRef.current;
  }, []);

  useEffect(() => {
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  const openDisplayWindow = useCallback(() => {
    window.open("/admin/voice-bible/display", "ucm-voice-bible-display", "noopener,width=1280,height=720");
  }, []);

  const applyPosition = useCallback(async (book: BibleBook, chapter: number, verseNumber: number) => {
    setStatus("looking-up");

    try {
      const verses = await fetchChapter(translationRef.current, book, chapter);
      const index = verses.findIndex((v) => v.verse === verseNumber);
      if (index === -1) {
        setPosition(null);
        setStatus("not-found");
        return;
      }
      setPosition({ book, chapter, verses, index });
      setStatus("found");
    } catch {
      setPosition(null);
      setStatus("error");
    }
  }, []);

  const lookup = useCallback(
    async (heard: string) => {
      const parsed = parseSpokenReference(heard);
      if (!parsed) {
        setStatus("not-found");
        setPosition(null);
        return;
      }
      await applyPosition(parsed.book, parsed.chapter, parsed.verse);
    },
    [applyPosition]
  );

  const manualChapter = parseInt(manualChapterStr) || 0;
  const manualVerse = parseInt(manualVerseStr) || 0;
  const canSubmitManual =
    !!manualBook && manualChapter >= 1 && manualChapter <= manualBook.chapters && manualVerse >= 1;

  const submitManual = useCallback(() => {
    if (!manualBook || !canSubmitManual) return;
    recognitionRef.current?.stop();
    setTranscript("");
    applyPosition(manualBook, manualChapter, manualVerse);
  }, [manualBook, manualChapter, manualVerse, canSubmitManual, applyPosition]);

  const goTo = useCallback(
    async (direction: 1 | -1) => {
      if (!position || navigating) return;
      const nextIndex = position.index + direction;

      if (nextIndex >= 0 && nextIndex < position.verses.length) {
        setPosition({ ...position, index: nextIndex });
        return;
      }

      const nextChapter = position.chapter + direction;
      if (nextChapter < 1 || nextChapter > position.book.chapters) return;

      setNavigating(true);
      try {
        const verses = await fetchChapter(translationRef.current, position.book, nextChapter);
        if (verses.length === 0) return;
        setPosition({
          book: position.book,
          chapter: nextChapter,
          verses,
          index: direction === 1 ? 0 : verses.length - 1,
        });
      } finally {
        setNavigating(false);
      }
    },
    [position, navigating]
  );

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
    setPosition(null);

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

  // Re-fetch the current chapter when the translation changes mid-lookup
  useEffect(() => {
    if (!position) return;
    let cancelled = false;
    (async () => {
      const verses = await fetchChapter(translationRef.current, position.book, position.chapter);
      if (cancelled || verses.length === 0) return;
      const verseNumber = position.verses[position.index]?.verse;
      const index = Math.max(
        0,
        verses.findIndex((v) => v.verse === verseNumber)
      );
      setPosition((p) => (p ? { ...p, verses, index } : p));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translation]);

  const isListening = status === "listening";
  const verse = position ? position.verses[position.index] : null;

  // Push the current verse to any open display window — keeps the
  // shareable display in sync without exposing the controls to it.
  useEffect(() => {
    const channel = getChannel();
    if (!channel) return;

    const message: VoiceBibleDisplayMessage = position
      ? {
          status: status === "looking-up" || navigating ? "loading" : "ready",
          book: position.book.name,
          chapter: position.chapter,
          verse: verse?.verse ?? null,
          translation,
          text: verse?.text ?? null,
          textSize,
        }
      : { status: "empty", book: null, chapter: null, verse: null, translation, text: null, textSize };

    lastMessageRef.current = message;
    channel.postMessage(message);
  }, [getChannel, position, verse, status, navigating, translation, textSize]);

  const verseDisplay = (
    <div className="mt-8 border-t border-cream-dark pt-6">
      <p className="text-gold-dark text-sm font-body font-semibold uppercase tracking-widest text-center mb-3">
        {position?.book.name} {position?.chapter}:{verse?.verse} ({translation})
      </p>
      {status === "looking-up" || navigating ? (
        <p className="text-center font-body italic text-navy/40 text-sm">Loading…</p>
      ) : verse ? (
        <p className="font-heading text-navy-dark text-2xl leading-relaxed italic text-center">
          &ldquo;{verse.text}&rdquo;
        </p>
      ) : (
        <p className="text-center font-body text-navy/40 text-sm">Verse text not found for that reference.</p>
      )}
    </div>
  );

  const navControls = (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => goTo(-1)}
        disabled={navigating || !position}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm transition-colors disabled:opacity-30 bg-cream text-navy hover:bg-cream-dark"
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <button
        onClick={() => goTo(1)}
        disabled={navigating || !position}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm transition-colors disabled:opacity-30 bg-cream text-navy hover:bg-cream-dark"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="bg-white border border-cream-dark rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-body text-navy/40">
          Open the display in its own window, then share <em>that</em> window — your controls stay
          private.
        </p>
        <button
          onClick={openDisplayWindow}
          className="flex items-center gap-1.5 text-xs font-body text-navy/50 hover:text-navy px-3 py-1.5 rounded-lg hover:bg-cream transition-colors flex-shrink-0"
          title="Open the shareable display window"
        >
          <MonitorPlay size={14} />
          Open display window
        </button>
      </div>

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

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-navy/50 font-body">Display text size:</span>
          {TEXT_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTextSize(opt.id)}
              className={`text-xs px-2.5 py-1 rounded-full font-body transition-colors ${
                textSize === opt.id ? "bg-navy text-cream" : "bg-cream text-navy/60 hover:text-navy"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setManualOpen((o) => !o)}
          className="text-xs font-body text-navy/50 hover:text-navy underline underline-offset-2"
        >
          {manualOpen ? "Hide manual entry" : "Voice didn't catch it? Enter book, chapter & verse manually"}
        </button>
      </div>

      {manualOpen && (
        <div className="mt-4 rounded-xl border border-dashed border-cream-dark p-4">
          <p className="text-xs font-body font-semibold text-navy/50 uppercase tracking-wider mb-3">
            Manual lookup
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-start">
            <div>
              <label className="block text-[11px] font-body text-navy/50 mb-1">Book</label>
              <BookCombobox value={manualBook} onChange={setManualBook} />
            </div>
            <div>
              <label className="block text-[11px] font-body text-navy/50 mb-1">Chapter</label>
              <input
                type="number"
                min={1}
                max={manualBook?.chapters ?? undefined}
                value={manualChapterStr}
                onChange={(e) => setManualChapterStr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitManual()}
                placeholder="Ch."
                className="w-20 rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-body text-navy/50 mb-1">Verse</label>
              <input
                type="number"
                min={1}
                value={manualVerseStr}
                onChange={(e) => setManualVerseStr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitManual()}
                placeholder="Vs."
                className="w-20 rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
              />
            </div>
            <button
              type="button"
              onClick={submitManual}
              disabled={!canSubmitManual}
              className="mt-[22px] px-4 py-1.5 rounded-lg font-body text-sm bg-navy text-cream hover:bg-navy-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
          {manualBook && manualChapter >= 1 && manualChapter > manualBook.chapters && (
            <p className="text-xs text-burgundy font-body mt-2">
              {manualBook.name} only has {manualBook.chapters} chapters.
            </p>
          )}
        </div>
      )}

      {position && (
        <>
          {verseDisplay}
          {navControls}
        </>
      )}
    </div>
  );
}
