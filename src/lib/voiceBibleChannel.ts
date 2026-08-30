// Shared contract between the voice-lookup control page and its
// separate, screen-shareable display window — synced via BroadcastChannel
// so the admin's controls never appear in whatever they're sharing.

export const VOICE_BIBLE_CHANNEL = "ucm-voice-bible-display";

export type TextSizeId = "sm" | "md" | "lg" | "xl";

// Max font size (px) the display will grow the verse text to — it will
// still shrink below this to keep the verse on-screen without scrolling.
export const TEXT_SIZE_PRESETS: Record<TextSizeId, number> = {
  sm: 48,
  md: 72,
  lg: 96,
  xl: 132,
};

export const DEFAULT_TEXT_SIZE: TextSizeId = "lg";

export interface VoiceBibleDisplayMessage {
  status: "empty" | "loading" | "ready";
  book: string | null;
  chapter: number | null;
  verse: number | null;
  translation: string;
  text: string | null;
  textSize: TextSizeId;
}
