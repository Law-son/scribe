"use client";

import toast from "react-hot-toast";

interface Props {
  title: string;
  url?: string; // defaults to window.location.href
  text?: string; // optional body text (used for quotes)
}

export function ShareButton({ title, url, text }: Props) {
  async function handleShare() {
    const shareUrl = url ?? window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl, ...(text ? { text } : {}) });
      } catch {
        // User cancelled — do nothing
      }
      return;
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm font-body text-navy/60 hover:text-navy border border-cream-dark rounded-full px-3 py-1.5 transition-colors ml-auto"
    >
      Share
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
    </button>
  );
}
