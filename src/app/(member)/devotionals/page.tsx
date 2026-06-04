import Link from "next/link";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";

export const metadata = { title: "Daily Devotionals" };

export default async function DevotionalsPage() {
  await connectDB();
  const now = new Date();

  const devotionals = await Devotional.find({ status: "approved" as const, scheduledAt: { $lte: now } })
    .sort({ dayNumber: -1 })
    .limit(30)
    .select("topic title verse dayNumber weekNumber weekTheme likesCount viewsCount")
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
          {devotionals.map((d, i) => {
            const displayTitle = d.topic ?? d.title ?? "Devotional";
            return (
              <Link key={d._id.toString()} href={`/devotionals/${d._id}`}>
                <div className={`bg-white border rounded-xl p-6 hover:shadow-md transition-all flex gap-4 ${i === 0 ? "border-gold/40 shadow-sm" : "border-cream-dark"}`}>
                  {/* Day badge */}
                  <div className="flex-shrink-0 text-center min-w-[48px]">
                    {d.dayNumber ? (
                      <>
                        <p className="font-heading text-2xl font-bold text-navy leading-none">{d.dayNumber}</p>
                        <p className="text-[10px] text-navy/40 font-body uppercase tracking-wide mt-0.5">Day</p>
                      </>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cream-dark" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {i === 0 && (
                      <span className="text-xs font-body text-gold-dark font-semibold block mb-0.5">Latest</span>
                    )}
                    <h2 className="font-heading text-lg font-semibold text-navy leading-snug">{displayTitle}</h2>
                    {d.verse && <p className="text-sm text-navy/60 font-body mt-0.5 italic">{d.verse}</p>}
                    {(d.weekNumber || d.weekTheme) && (
                      <p className="text-xs text-navy/40 font-body mt-1">
                        {d.weekNumber && `Week ${d.weekNumber}`}
                        {d.weekNumber && d.weekTheme && " · "}
                        {d.weekTheme}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 font-body flex-shrink-0 pt-1">❤️ {d.likesCount ?? 0}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
