"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { EditLink } from "@/components/admin/EditLink";

interface UserActionsProps {
  id: string;
  name: string;
  editHref: string;
}

export function UserActions({ id, name, editHref }: UserActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      toast.success("Member deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <EditLink href={editHref} />
        <button
          onClick={() => setConfirming(true)}
          disabled={busy}
          title="Delete"
          className="p-1.5 rounded-md text-burgundy/50 hover:text-burgundy hover:bg-burgundy/5 transition-colors disabled:opacity-40"
        >
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-heading text-lg text-navy font-bold mb-2">Delete {name}?</h3>
            <p className="text-sm text-navy/60 font-body mb-6">
              This will permanently remove this member&apos;s account. This action cannot be undone.
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
