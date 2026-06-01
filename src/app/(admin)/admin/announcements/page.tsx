import Link from "next/link";
import connectDB from "@/lib/db";
import Announcement from "@/models/Announcement";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await connectDB();
  const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(50).lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Announcements</h1>
        </div>
        <Link href="/admin/announcements/new" className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">
          + New Announcement
        </Link>
      </div>
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-center text-navy/50 font-body py-12">No announcements yet.</p>
        ) : announcements.map((a) => (
          <div key={a._id.toString()} className={`bg-white border rounded-xl p-5 ${a.isUrgent ? "border-burgundy/40" : "border-cream-dark"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-body font-semibold text-navy">{a.title}</h3>
                  {a.isUrgent && <Badge variant="burgundy">Urgent</Badge>}
                  {a.smsTriggered && <Badge variant="green">SMS Sent</Badge>}
                </div>
                <p className="text-sm text-navy/60 font-body line-clamp-2">{a.body}</p>
                <p className="text-xs text-gray-400 font-body mt-2">{format(new Date(a.createdAt), "MMM d, yyyy")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
