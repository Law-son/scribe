"use client";

import { useState, useEffect } from "react";

interface Quote {
  text: string;
  author: string;
}

interface QuoteCarouselProps {
  quotes: Quote[];
}

export function QuoteCarousel({ quotes }: QuoteCarouselProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 400);
    }, 30000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  if (quotes.length === 0) return null;

  const quote = quotes[index];

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-ivory to-cream border border-gold/20 px-8 py-7 overflow-hidden">
      {/* giant quotation mark */}
      <svg className="absolute top-4 left-5 w-10 h-10 text-gold/20" viewBox="0 0 40 40" fill="currentColor">
        <path d="M0 28 C0 18 6 10 18 6 L20 10 C14 13 11 17 11 22 C11 22 13 22 14 22 C17 22 20 25 20 29 C20 33 17 36 13 36 C6 36 0 33 0 28 Z M20 28 C20 18 26 10 38 6 L40 10 C34 13 31 17 31 22 C31 22 33 22 34 22 C37 22 40 25 40 29 C40 33 37 36 33 36 C26 36 20 33 20 28 Z"/>
      </svg>

      <div
        className="transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="font-heading text-navy-dark text-lg italic leading-relaxed pl-6 relative z-10">
          {quote.text}
        </p>
        <div className="flex items-center gap-2 mt-4 pl-6">
          <div className="h-px w-8 bg-gold/40" />
          <p className="text-gold-dark text-sm font-body font-medium">{quote.author}</p>
        </div>
      </div>

      {/* Dots indicator */}
      {quotes.length > 1 && (
        <div className="flex gap-1.5 justify-end mt-4">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setVisible(false);
                setTimeout(() => { setIndex(i); setVisible(true); }, 400);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === index ? "bg-gold w-4" : "bg-gold/30"
              }`}
              aria-label={`Quote ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
