// Shared contract between the voice-lookup control page and its
// separate, screen-shareable display window — synced via BroadcastChannel
// so the admin's controls never appear in whatever they're sharing.

export const VOICE_BIBLE_CHANNEL = "ucm-voice-bible-display";

export interface VoiceBibleDisplayMessage {
  status: "empty" | "loading" | "ready";
  book: string | null;
  chapter: number | null;
  verse: number | null;
  translation: string;
  text: string | null;
}
