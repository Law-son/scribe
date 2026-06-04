import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import BibleStudy from "@/models/BibleStudy";
import Devotional from "@/models/Devotional";
import User from "@/models/User";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await connectDB();

  const [topSermons, topBibleStudies, topDevotionals, topEvangelists] = await Promise.all([
    Sermon.find({ status: "published" }).sort({ viewsCount: -1 }).limit(5).select("title preacher viewsCount likesCount").lean(),
    BibleStudy.find({ status: "published" }).sort({ viewsCount: -1 }).limit(5).select("title topic viewsCount likesCount").lean(),
    Devotional.find({ status: "approved" }).sort({ viewsCount: -1 }).limit(5).select("topic title dayNumber viewsCount likesCount").lean(),
    User.find().sort({ totalPoints: -1 }).limit(10).select("name totalPoints").lean(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Reports & Analytics</h1>
        <p className="text-navy/60 font-body mt-1">Engagement and content performance overview.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Sermons */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-4">📖 Most Viewed Sermons</h2>
          {topSermons.length === 0 ? <p className="text-navy/40 font-body text-sm">No data yet.</p> : (
            <div className="space-y-3">
              {topSermons.map((s, i) => (
                <div key={s._id.toString()} className="flex items-center gap-3">
                  <span className="text-lg w-6">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-navy truncate">{s.title}</p>
                    <p className="text-xs text-navy/50 font-body">{s.preacher}</p>
                  </div>
                  <div className="text-right text-xs text-navy/60 font-body">
                    <p>👁 {s.viewsCount ?? 0}</p>
                    <p>❤️ {s.likesCount ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Bible Studies */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-4">✝️ Most Viewed Bible Studies</h2>
          {topBibleStudies.length === 0 ? <p className="text-navy/40 font-body text-sm">No data yet.</p> : (
            <div className="space-y-3">
              {topBibleStudies.map((b, i) => (
                <div key={b._id.toString()} className="flex items-center gap-3">
                  <span className="text-lg w-6">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-navy truncate">{b.topic ?? b.title}</p>
                  </div>
                  <div className="text-right text-xs text-navy/60 font-body">
                    <p>👁 {b.viewsCount ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Devotionals */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-4">🕊️ Most Viewed Devotionals</h2>
          {topDevotionals.length === 0 ? <p className="text-navy/40 font-body text-sm">No data yet.</p> : (
            <div className="space-y-3">
              {topDevotionals.map((d, i) => (
                <div key={d._id.toString()} className="flex items-center gap-3">
                  <span className="text-lg w-6">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-navy truncate">{d.topic ?? d.title}</p>
                    {d.dayNumber && <p className="text-xs text-navy/50 font-body">Day {d.dayNumber}</p>}
                  </div>
                  <span className="text-xs text-navy/60 font-body">👁 {d.viewsCount ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Evangelists */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-4">🌟 Most Active Members</h2>
          {topEvangelists.length === 0 ? <p className="text-navy/40 font-body text-sm">No data yet.</p> : (
            <div className="space-y-3">
              {topEvangelists.map((u, i) => (
                <div key={u._id.toString()} className="flex items-center gap-3">
                  <span className="text-lg w-6">{i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}</span>
                  <p className="flex-1 text-sm font-body font-medium text-navy">{u.name}</p>
                  <span className="font-heading font-bold text-navy text-sm">{u.totalPoints.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
