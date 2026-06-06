"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface ContentActionsProps {
  id: string;
  apiBase: string; // e.g. "/api/sermons"
  status?: string; // current status — undefined means no hide/show toggle (e.g. announcements)
  publishedStatus?: string; // what "published" looks like for this content type (default "published")
  draftStatus?: string;     // what "hidden/draft" looks like (default "draft")
  label?: string; // for confirm dialog
}

export function ContentActions({
  id,
  apiBase,
  status,
  publishedStatus = "published",
  draftStatus = "draft",
  label = "this item",
}: ContentActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isVisible = status === publishedStatus;
  const hasStatus = status !== undefined;

  async function toggleVisibility() {
    setBusy(true);
    try {
      const newStatus = isVisible ? draftStatus : publishedStatus;
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(isVisible ? "Hidden from members" : "Now visible to members");
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted successfully");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {hasStatus && (
          <button
            onClick={toggleVisibility}
            disabled={busy}
            title={isVisible ? "Hide from members" : "Make visible to members"}
            className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
              isVisible
                ? "text-navy/30 hover:text-navy hover:bg-navy/5"
                : "text-forest hover:text-forest/70 hover:bg-forest/5"
            }`}
          >
            {isVisible ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
          </button>
        )}
        <button
          onClick={() => setConfirming(true)}
          disabled={busy}
          title="Delete"
          className="p-1.5 rounded-md text-burgundy/50 hover:text-burgundy hover:bg-burgundy/5 transition-colors disabled:opacity-40"
        >
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      </div>

      {/* Confirm overlay */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-heading text-lg text-navy font-bold mb-2">Delete {label}?</h3>
            <p className="text-sm text-navy/60 font-body mb-6">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="flex-1 h-10 rounded-lg border border-cream-dark text-navy text-sm font-body hover:bg-cream-light transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 h-10 rounded-lg bg-burgundy text-white text-sm font-body hover:bg-burgundy/80 transition-colors disabled:opacity-40"
              >
                {busy ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
