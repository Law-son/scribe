import Link from "next/link";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import { format } from "date-fns";

export const metadata = { title: "Daily Devotionals" };

export default async function DevotionalsPage() {
  await connectDB();
  const now = new Date();

  const devotionals = await Devotional.find({ status: "approved" as const, scheduledAt: { $lte: now } })
    .sort({ scheduledAt: -1 })
    .limit(20)
    .select("title verse scheduledAt likesCount viewsCount")
    .lean();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Daily Devotionals</h1>
        <p className="text-navy/60 font-body mt-1">Start each day with purpose and faith.</p>
      </div>

      {devotionals.length === 0 ? (
        <p className="text-center text-navy/50 font-body py-16">No devotionals available yet.</p>
      ) : (
        <div className="space-y-4">
          {devotionals.map((d, i) => (
            <Link key={d._id.toString()} href={`/devotionals/${d._id}`}>
              <div className={`bg-white border rounded-xl p-6 hover:shadow-md transition-all flex gap-4 ${i === 0 ? "border-gold/40 shadow-sm" : "border-cream-dark"}`}>
                <div className="flex-shrink-0 text-center">
                  <p className="font-heading text-2xl font-bold text-navy">{format(new Date(d.scheduledAt), "d")}</p>
                  <p className="text-xs text-navy/50 font-body">{format(new Date(d.scheduledAt), "MMM")}</p>
                </div>
                <div className="flex-1 min-w-0">
                  {i === 0 && <span className="text-xs font-body text-gold-dark font-medium">Today</span>}
                  <h2 className="font-heading text-lg font-semibold text-navy leading-snug">{d.title}</h2>
                  {d.verse && <p className="text-sm text-navy/60 font-body mt-0.5 italic">{d.verse}</p>}
                </div>
                <div className="text-xs text-gray-400 font-body flex-shrink-0">❤️ {d.likesCount ?? 0}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
