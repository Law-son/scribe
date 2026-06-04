"use client";

import { useState, useEffect, useCallback } from "react";
import { BIBLE_BOOKS, TRANSLATIONS, parseReference } from "@/lib/bibleBooks";

interface Verse {
  verse: number;
  text: string;
}

interface ModalState {
  bookId: number;
  chapter: number;
  verse: number;
  translation: string;
}

interface Props {
  initial: ModalState;
  onClose: () => void;
}

function VerseModal({ initial, onClose }: Props) {
  const [state, setState] = useState<ModalState>(initial);
  const [chapterData, setChapterData] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  const book = BIBLE_BOOKS.find((b) => b.id === state.bookId)!;
  const currentVerse = chapterData.find((v) => v.verse === state.verse);

  const fetchChapter = useCallback(
    (s: ModalState) => {
      setLoading(true);
      fetch(`/api/bible/chapter?translation=${s.translation}&book=${s.bookId}&chapter=${s.chapter}`)
        .then((r) => r.json())
        .then((d) => setChapterData(d.verses ?? []))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => { fetchChapter(state); }, [state.bookId, state.chapter, state.translation]); // eslint-disable-line

  function update(patch: Partial<ModalState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  const maxVerse = chapterData.length;
  const maxChapter = book?.chapters ?? 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-navy px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-gold text-xs font-body uppercase tracking-widest mb-0.5">Scripture</p>
            <p className="text-cream font-heading font-semibold">
              {book?.name} {state.chapter}:{state.verse}
            </p>
          </div>
          <button onClick={onClose} className="text-cream/50 hover:text-cream p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Translation selector */}
        <div className="px-6 pt-4 pb-2 border-b border-cream-dark">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-navy/50 font-body">Translation:</span>
            {TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ translation: t.id })}
                className={`text-xs px-2.5 py-1 rounded-full font-body transition-colors ${
                  state.translation === t.id
                    ? "bg-navy text-cream"
                    : "bg-cream text-navy/60 hover:text-navy"
                }`}
              >
                {t.id}
              </button>
            ))}
          </div>
        </div>

        {/* Verse content */}
        <div className="px-6 py-6 min-h-[140px] flex items-center">
          {loading ? (
            <p className="text-navy/40 text-sm font-body italic w-full text-center">Loading…</p>
          ) : currentVerse ? (
            <p className="font-heading text-navy-dark text-lg leading-relaxed italic">
              &ldquo;{currentVerse.text}&rdquo;
            </p>
          ) : (
            <p className="text-navy/40 text-sm font-body w-full text-center">Verse not found</p>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {/* Chapter nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => update({ chapter: Math.max(1, state.chapter - 1), verse: 1 })}
              disabled={state.chapter <= 1}
              className="p-2 rounded-lg text-navy/50 hover:text-navy hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous chapter"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>
              </svg>
            </button>
            <span className="text-xs text-navy/50 font-body px-1">Ch. {state.chapter}</span>
            <button
              onClick={() => update({ chapter: Math.min(maxChapter, state.chapter + 1), verse: 1 })}
              disabled={state.chapter >= maxChapter}
              className="p-2 rounded-lg text-navy/50 hover:text-navy hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next chapter"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>
              </svg>
            </button>
          </div>

          {/* Reference display */}
          <span className="text-xs text-gold-dark font-body font-medium">
            {book?.name} {state.chapter}:{state.verse} ({state.translation})
          </span>

          {/* Verse nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => update({ verse: Math.max(1, state.verse - 1) })}
              disabled={state.verse <= 1}
              className="p-2 rounded-lg text-navy/50 hover:text-navy hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous verse"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <span className="text-xs text-navy/50 font-body px-1">v. {state.verse}</span>
            <button
              onClick={() => update({ verse: Math.min(maxVerse || 999, state.verse + 1) })}
              disabled={!!maxVerse && state.verse >= maxVerse}
              className="p-2 rounded-lg text-navy/50 hover:text-navy hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next verse"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface BibleVerseModalProps {
  children: React.ReactNode;
}

export function BibleVerseModal({ children }: BibleVerseModalProps) {
  const [modal, setModal] = useState<{ bookId: number; chapter: number; verse: number; translation: string } | null>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const block = (e.target as HTMLElement).closest("[data-bible-verse]") as HTMLElement | null;
    if (!block) return;
    const reference = block.getAttribute("data-reference") ?? "";
    const translation = block.getAttribute("data-translation") ?? "NKJV";
    const parsed = parseReference(reference);
    if (!parsed) return;
    setModal({ bookId: parsed.book.id, chapter: parsed.chapter, verse: parsed.verse, translation });
  }, []);

  return (
    <>
      <div onClick={handleClick} className="[&_[data-bible-verse]]:cursor-pointer">
        {children}
      </div>
      {modal && (
        <VerseModal initial={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
