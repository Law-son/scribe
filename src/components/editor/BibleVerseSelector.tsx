"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { BIBLE_BOOKS, TRANSLATIONS, DEFAULT_TRANSLATION, stripVerseHtml } from "@/lib/bibleBooks";
import { VerseModal, type VerseModalState } from "@/components/content/BibleVerseModal";

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
  const [bookIdx, setBookIdx] = useState(42);
  // Use string state so the user can clear and retype
  const [chapterStr, setChapterStr] = useState("3");
  const [verseStartStr, setVerseStartStr] = useState("16");
  const [verseEndStr, setVerseEndStr] = useState("");
  const [chapterData, setChapterData] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewModal, setPreviewModal] = useState<VerseModalState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const book = BIBLE_BOOKS[bookIdx];
  const chapter = Math.max(1, parseInt(chapterStr) || 1);
  const verseStart = Math.max(1, parseInt(verseStartStr) || 1);
  const verseEnd = verseEndStr.trim() !== "" ? Math.max(verseStart, parseInt(verseEndStr) || verseStart) : null;

  const startVerseObj = chapterData.find((v) => v.verse === verseStart);
  const endVerseObj = verseEnd !== null ? chapterData.find((v) => v.verse === verseEnd) : null;

  // Collect all verses in the range for a preview
  const rangeVerses = verseEnd !== null
    ? chapterData.filter((v) => v.verse >= verseStart && v.verse <= verseEnd)
    : startVerseObj ? [startVerseObj] : [];

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
        const verses: Verse[] = (data.verses ?? []).map((v: Verse) => ({ ...v, text: stripVerseHtml(v.text) }));
        setChapterData(verses);
        // Clamp start verse to valid range
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

  function handleInsert() {
    if (rangeVerses.length === 0) return;
    editor.chain().focus().insertContent({
      type: "bibleVerse",
      attrs: { reference, text: previewText, translation },
    }).run();
    setOpen(false);
    setPreviewModal({ bookId: book.id, chapter, verse: verseStart, translation });
  }

  const canInsert = rangeVerses.length > 0 && !loading;

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
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        Bible
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[340px] max-h-[min(34rem,80vh)] bg-white border border-cream-dark rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-navy border-b border-navy-light/30 flex-shrink-0">
            <p className="text-xs font-body font-semibold text-gold uppercase tracking-widest">Insert Bible Verse</p>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
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
                  <p className="text-sm font-body text-navy-dark leading-relaxed italic max-h-40 overflow-y-auto pr-1">
                    &ldquo;{previewText}&rdquo;
                  </p>
                  <p className="text-[11px] text-gold-dark font-body font-medium mt-2">— {reference} ({translation})</p>
                </>
              ) : (
                <p className="text-xs text-navy/40 font-body italic">Select a verse to preview</p>
              )}
            </div>
          </div>

          <div className="p-4 pt-3 border-t border-cream-dark flex-shrink-0">
            <button type="button" onClick={handleInsert} disabled={!canInsert}
              className="w-full bg-navy text-cream text-sm font-body font-medium py-2 rounded-xl hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Insert Verse
            </button>
          </div>
        </div>
      )}

      {previewModal && (
        <VerseModal initial={previewModal} onClose={() => setPreviewModal(null)} />
      )}
    </div>
  );
}
