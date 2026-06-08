import { VoiceVerseLookup } from "@/components/admin/VoiceVerseLookup";

export const metadata = { title: "Voice Bible Lookup" };

export default function AdminVoiceBiblePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Voice Bible Lookup</h1>
        <p className="text-navy/60 font-body mt-1">
          Speak a verse reference during service and have it appear instantly — handy when a
          preacher calls out a quotation and you need to display it without searching manually.
        </p>
      </div>

      <div className="max-w-2xl">
        <VoiceVerseLookup />
      </div>
    </div>
  );
}
