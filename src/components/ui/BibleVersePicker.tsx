"use client";

import { useState, useEffect, useRef } from "react";
import { BIBLE_BOOKS, TRANSLATIONS, DEFAULT_TRANSLATION } from "@/lib/bibleBooks";

export interface VerseValue {
  reference: string;
  text: string;
  translation: string;
}

interface Props {
  value: VerseValue | null;
  onChange: (val: VerseValue) => void;
  label?: string;
}

interface Verse {
  verse: number;
  text: string;
}

export function BibleVersePicker({ value, onChange, label = "Scripture Reference" }: Props) {
  const [open, setOpen] = useState(false);
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const [bookIdx, setBookIdx] = useState(42);
  // String state so the user can clear and retype freely
  const [chapterStr, setChapterStr] = useState("3");
  const [verseStartStr, setVerseStartStr] = useState("16");
  const [verseEndStr, setVerseEndStr] = useState("");
  const [chapterData, setChapterData] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const book = BIBLE_BOOKS[bookIdx];
  const chapter = Math.max(1, parseInt(chapterStr) || 1);
  const verseStart = Math.max(1, parseInt(verseStartStr) || 1);
  const verseEnd = verseEndStr.trim() !== "" ? Math.max(verseStart, parseInt(verseEndStr) || verseStart) : null;

  const rangeVerses = verseEnd !== null
    ? chapterData.filter((v) => v.verse >= verseStart && v.verse <= verseEnd)
    : chapterData.filter((v) => v.verse === verseStart);

  const reference = verseEnd !== null
    ? `${book.name} ${chapter}:${verseStart}-${verseEnd}`
    : `${book.name} ${chapter}:${verseStart}`;

  const previewText = rangeVerses.map((v) => v.text).join(" ");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    const c = Math.max(1, parseInt(chapterStr) || 1);
    fetch(`/api/bible/chapter?translation=${translation}&book=${book.id}&chapter=${c}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const verses: Verse[] = data.verses ?? [];
        setChapterData(verses);
        const maxV = verses.length;
        if (verseStart > maxV) setVerseStartStr(String(maxV));
      })
      .catch(() => setError("Could not load verses"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, translation, bookIdx, chapterStr]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleConfirm() {
    if (rangeVerses.length === 0) return;
    onChange({ reference, text: previewText, translation });
    setOpen(false);
  }

  const canConfirm = rangeVerses.length > 0 && !loading;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-navy font-body mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-cream-dark bg-white text-sm font-body text-left hover:border-navy/40 focus:outline-none focus:ring-2 focus:ring-navy transition-colors"
      >
        {value ? (
          <span className="text-navy font-medium">
            {value.reference} <span className="font-normal text-navy/50">({value.translation})</span>
          </span>
        ) : (
          <span className="text-navy/40">Select a scripture verse…</span>
        )}
        <svg className="w-4 h-4 text-navy/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </button>

      {value?.text && (
        <p className="mt-1.5 text-xs font-body text-navy/60 italic bg-cream px-3 py-2 rounded-md border border-cream-dark">
          &ldquo;{value.text}&rdquo;
        </p>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[340px] bg-white border border-cream-dark rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-navy border-b border-navy-light/30">
            <p className="text-xs font-body font-semibold text-gold uppercase tracking-widest">Select Bible Verse</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Translation */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Translation</label>
              <select value={translation} onChange={(e) => setTranslation(e.target.value)}
                className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40">
                {TRANSLATIONS.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
              </select>
            </div>

            {/* Book */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Book</label>
              <select value={bookIdx} onChange={(e) => { setBookIdx(Number(e.target.value)); setChapterStr("1"); setVerseStartStr("1"); setVerseEndStr(""); }}
                className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40">
                {BIBLE_BOOKS.map((b, i) => <option key={b.id} value={i}>{b.name}</option>)}
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">Chapter</label>
              <input type="number" min={1} max={book.chapters} value={chapterStr}
                onChange={(e) => { setChapterStr(e.target.value); setVerseStartStr("1"); setVerseEndStr(""); }}
                onBlur={(e) => {
                  const v = Math.min(book.chapters, Math.max(1, parseInt(e.target.value) || 1));
                  setChapterStr(String(v));
                }}
                className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
              />
            </div>

            {/* Verse range */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-navy/50 uppercase tracking-wider mb-1">
                Verse <span className="normal-case text-navy/40">(or range)</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={chapterData.length || 999} placeholder="From" value={verseStartStr}
                  onChange={(e) => { setVerseStartStr(e.target.value); setVerseEndStr(""); }}
                  onBlur={(e) => {
                    const max = chapterData.length || 999;
                    const v = Math.min(max, Math.max(1, parseInt(e.target.value) || 1));
                    setVerseStartStr(String(v));
                  }}
                  className="w-full rounded-lg border border-cream-dark bg-cream-light text-navy text-sm font-body px-3 py-1.5 focus:outline-none focus:border-navy/40"
                />
                <span className="text-navy/40 font-body text-sm flex-shrink-0">to</span>
                <input type="number" min={verseStart} max={chapterData.length || 999} placeholder="(opt)"
                  value={verseEndStr}
                  onChange={(e) => setVerseEndStr(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value === "") { setVerseEndStr(""); return; }
                    const max = chapterData.length || 999;
                    const v = Math.min(max, Math.max(verseStart, parseInt(e.target.value) || verseStart));
                    setVerseEndStr(String(v));
                  }}
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
              ) : previewText ? (
                <>
                  <p className="text-sm font-body text-navy-dark leading-relaxed italic line-clamp-4">&ldquo;{previewText}&rdquo;</p>
                  <p className="text-[11px] text-gold-dark font-body font-medium mt-2">— {reference} ({translation})</p>
                </>
              ) : (
                <p className="text-xs text-navy/40 font-body italic">Select a verse to preview</p>
              )}
            </div>

            <button type="button" onClick={handleConfirm} disabled={!canConfirm}
              className="w-full bg-navy text-cream text-sm font-body font-medium py-2 rounded-xl hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Confirm Verse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
