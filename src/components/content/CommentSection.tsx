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
  currentUserId?: string;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-navy/40">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

function CommentItem({
  comment,
  contentType,
  contentId,
  currentUserId,
  onReplyPosted,
  isReply = false,
}: {
  comment: SerializedComment;
  contentType: CommentSectionProps["contentType"];
  contentId: string;
  currentUserId?: string;
  onReplyPosted: (parentId: string, reply: SerializedComment) => void;
  isReply?: boolean;
}) {
  const [liked, setLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [likePending, setLikePending] = useState(false);

  async function toggleLike() {
    if (!currentUserId) { toast.error("Sign in to like"); return; }
    if (likePending) return;
    setLikePending(true);
    // Optimistic
    setLiked(!liked);
    setLikesCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      // Revert
      setLiked(liked);
      setLikesCount((c) => c + (liked ? 1 : -1));
      toast.error("Failed to like");
    } finally {
      setLikePending(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/${contentType}/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, parentId: comment.id }),
      });
      if (!res.ok) {
        if (res.status === 401) { toast.error("Sign in to reply"); return; }
        throw new Error();
      }
      const reply = await res.json();
      onReplyPosted(comment.id, reply);
      setReplyText("");
      setShowReplyForm(false);
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className={`flex gap-3 ${isReply ? "ml-10 mt-3" : ""}`}>
      <Avatar name={comment.authorName} size="sm" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-navy font-body">{comment.authorName}</span>
          <span className="text-xs text-gray-400 font-body">
            {format(new Date(comment.createdAt), "MMM d, yyyy")}
          </span>
        </div>
        <p className="text-sm text-navy-dark font-body leading-relaxed">{comment.text}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 text-xs font-body text-navy/50 hover:text-navy transition-colors"
          >
            <HeartIcon filled={liked} />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {!isReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1.5 text-xs font-body text-navy/50 hover:text-navy transition-colors"
            >
              <ReplyIcon />
              Reply
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <form onSubmit={submitReply} className="mt-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.authorName}…`}
              rows={2}
              className="w-full rounded-xl border border-cream-dark bg-white px-4 py-2.5 text-sm font-body text-navy-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            />
            <div className="flex items-center gap-2 mt-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowReplyForm(false); setReplyText(""); }}
                className="text-xs font-body text-navy/50 hover:text-navy px-3 py-1.5"
              >
                Cancel
              </button>
              <Button type="submit" size="sm" loading={submittingReply} disabled={!replyText.trim()}>
                Reply
              </Button>
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-1">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                contentType={contentType}
                contentId={contentId}
                currentUserId={currentUserId}
                onReplyPosted={onReplyPosted}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ contentType, contentId, initialComments, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  function handleReplyPosted(parentId: string, reply: SerializedComment) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), reply] }
          : c
      )
    );
  }

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

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section className="mt-10 pt-8 border-t border-cream-dark">
      <h3 className="font-heading text-xl text-navy font-semibold mb-6">
        Comments ({totalCount})
      </h3>

      {/* New comment form */}
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
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 font-body text-center py-4">
            Be the first to leave a comment.
          </p>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            contentType={contentType}
            contentId={contentId}
            currentUserId={currentUserId}
            onReplyPosted={handleReplyPosted}
          />
        ))}
      </div>
    </section>
  );
}
