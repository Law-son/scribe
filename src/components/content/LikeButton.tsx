"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface LikeButtonProps {
  contentType: "sermons" | "bible-study" | "devotionals" | "quotes";
  contentId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ contentType, contentId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/${contentType}/${contentId}/like`, { method: "POST" });
      if (!res.ok) {
        if (res.status === 401) { toast.error("Sign in to like"); return; }
        throw new Error();
      }
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.likesCount);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-sm font-body transition-colors px-3 py-1.5 rounded-full border ${
        liked
          ? "border-burgundy text-burgundy bg-burgundy/5"
          : "border-cream-dark text-navy/60 hover:border-burgundy hover:text-burgundy"
      }`}
    >
      <span className="text-base">{liked ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}
