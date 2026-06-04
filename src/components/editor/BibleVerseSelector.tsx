"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { BIBLE_BOOKS, TRANSLATIONS, DEFAULT_TRANSLATION } from "@/lib/bibleBooks";

interface Verse {
  verse: number;
  text: string;
}

interface Props {
  editor: Editor;
}

export function BibleVerseSelector({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const [bookIdx, setBookIdx] = useState(42); // John (index 42 = id 43)
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [chapterData, setChapterData] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const book = BIBLE_BOOKS[bookIdx];
  const maxChapter = book.chapters;
  const currentVerse = chapterData.find((v) => v.verse === verse);

  // Fetch chapter whenever translation/book/chapter changes (and popover is open)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(`/api/bible/chapter?translation=${translation}&book=${book.id}&chapter=${chapter}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setChapterData(data.verses ?? []);
        // Clamp verse to valid range
        const maxVerse = (data.verses as Verse[]).length;
        if (verse > maxVerse) setVerse(maxVerse);
      })
      .catch(() => setError("Could not load verses"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, translation, bookIdx, chapter]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleInsert() {
    if (!currentVerse) return;
    editor.chain().focus().insertContent({
      type: "bibleVerse",
      attrs: {
        reference: `${book.name} ${chapter}:${verse}`,
        text: currentVerse.text,
        translation,
      },
    }).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        title="Insert Bible verse"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${
          open ? "bg-navy text-cream" : "text-navy/70 hover:bg-cream-dark hover:text-navy"
        }`}
      >
        {/* Book/cross icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        Bible
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white border border-cream-dark rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-navy border-b border-navy-light/30">
            <p className="text-xs font-body font-semibold text-gold uppercase tracking-widest">Insert Bible Verse</p>
          </div>

          <div className="p-4 space-y-3">
            {/* Translation */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Translation</label>
              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
              >
                {TRANSLATIONS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                ))}
              </select>
            </div>

            {/* Book */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Book</label>
              <select
                value={bookIdx}
                onChange={(e) => { setBookIdx(Number(e.target.value)); setChapter(1); setVerse(1); }}
                className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
              >
                {BIBLE_BOOKS.map((b, i) => (
                  <option key={b.id} value={i}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Chapter + Verse */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Chapter</label>
                <input
                  type="number" min={1} max={maxChapter} value={chapter}
                  onChange={(e) => { setChapter(Math.min(maxChapter, Math.max(1, Number(e.target.value)))); setVerse(1); }}
                  className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Verse</label>
                <input
                  type="number" min={1} max={chapterData.length || 999} value={verse}
                  onChange={(e) => setVerse(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-cream border border-cream-dark px-4 py-3 min-h-[80px] flex flex-col justify-between">
              {loading ? (
                <p className="text-xs text-navy/40 font-body italic">Loading…</p>
              ) : error ? (
                <p className="text-xs text-burgundy font-body">{error}</p>
              ) : currentVerse ? (
                <>
                  <p className="text-sm font-body text-navy-dark leading-relaxed italic">
                    &ldquo;{currentVerse.text}&rdquo;
                  </p>
                  <p className="text-[11px] text-gold-dark font-body font-medium mt-2">
                    — {book.name} {chapter}:{verse} ({translation})
                  </p>
                </>
              ) : (
                <p className="text-xs text-navy/40 font-body italic">Select a verse to preview</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleInsert}
              disabled={!currentVerse || loading}
              className="w-full bg-navy text-cream text-sm font-body font-medium py-2 rounded-xl hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Insert Verse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
