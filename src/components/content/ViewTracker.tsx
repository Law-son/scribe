"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  contentType: "sermons" | "bible-study" | "devotionals";
  contentId: string;
}

export function ViewTracker({ contentType, contentId }: ViewTrackerProps) {
  useEffect(() => {
    fetch(`/api/${contentType}/${contentId}/view`, { method: "POST" }).catch(() => {});
  }, [contentType, contentId]);
  return null;
}
