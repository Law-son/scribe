"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { SerializedComment } from "@/types";

interface CommentSectionProps {
  contentType: "sermons" | "bible-study" | "devotionals" | "quotes";
  contentId: string;
  initialComments: SerializedComment[];
}

export function CommentSection({ contentType, contentId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/${contentType}/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        if (res.status === 401) { toast.error("Sign in to comment"); return; }
        throw new Error();
      }
      const comment = await res.json();
      setComments([comment, ...comments]);
      setText("");
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 pt-8 border-t border-cream-dark">
      <h3 className="font-heading text-xl text-navy font-semibold mb-6">
        Reflections ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={submit} className="mb-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your reflection…"
          rows={3}
          className="w-full rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm font-body text-navy-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button type="submit" size="sm" loading={loading} disabled={!text.trim()}>
            Post Reflection
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-5">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 font-body text-center py-4">
            Be the first to share a reflection.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.authorName} size="sm" className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-navy font-body">{c.authorName}</span>
                <span className="text-xs text-gray-400 font-body">
                  {format(new Date(c.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <p className="text-sm text-navy-dark font-body leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
