import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  await connectDB();
  const now = new Date();

  const announcements = await Announcement.find({
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  })
    .sort({ isUrgent: -1, createdAt: -1 })
    .limit(30)
    .lean();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Announcements</h1>
        <p className="text-navy/60 font-body mt-1">Stay up to date with church news and events.</p>
      </div>

      {announcements.length === 0 ? (
        <p className="text-center text-navy/50 font-body py-16">No announcements at the moment.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a._id.toString()}
              className={`bg-white rounded-xl border p-6 ${a.isUrgent ? "border-burgundy/40 border-l-4 border-l-burgundy" : "border-cream-dark"}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <h2 className="font-heading text-lg font-semibold text-navy flex-1 leading-snug">{a.title}</h2>
                {a.isUrgent && <Badge variant="burgundy">Urgent</Badge>}
              </div>
              <p className="text-sm text-navy-dark font-body leading-relaxed whitespace-pre-line">{a.body}</p>
              <p className="text-xs text-gray-400 font-body mt-4">
                {format(new Date(a.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
