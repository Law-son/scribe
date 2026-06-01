import Link from "next/link";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import Devotional from "@/models/Devotional";
import BibleStudy from "@/models/BibleStudy";
import Quote from "@/models/Quote";
import PointTransaction from "@/models/PointTransaction";
import { getCurrentUser } from "@/lib/auth";
import { format, startOfWeek } from "date-fns";
import { Footer } from "@/components/layout/Footer";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const SOCIAL_LINKS = [
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "WhatsApp", href: "#", Icon: WhatsAppIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  let latestQuote = null;
  let latestSermon = null;
  let latestDevotional = null;
  let latestBibleStudy = null;
  let weeklyTop5: { name: string; points: number }[] = [];

  try {
    await connectDB();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    [latestQuote, latestSermon, latestDevotional, latestBibleStudy, weeklyTop5] =
      await Promise.all([
        Quote.findOne({ status: "published" }).sort({ createdAt: -1 }).lean(),
        Sermon.findOne({ status: "published" }).sort({ publishedAt: -1 }).select("title preacher publishedAt viewsCount").lean(),
        Devotional.findOne({ status: "approved", scheduledAt: { $lte: now } }).sort({ scheduledAt: -1 }).select("title verse scheduledAt").lean(),
        BibleStudy.findOne({ status: "published" }).sort({ publishedAt: -1 }).select("title topic publishedAt").lean(),
        PointTransaction.aggregate([
          { $match: { createdAt: { $gte: weekStart } } },
          { $group: { _id: "$userId", points: { $sum: "$points" } } },
          { $sort: { points: -1 } },
          { $limit: 5 },
          { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
          { $unwind: "$user" },
          { $project: { _id: 0, name: "$user.name", points: 1 } },
        ]),
      ]);
  } catch {
    // DB not configured yet — show page without dynamic content
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── HERO ─── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F1D35 0%, #1B2A4A 60%, #2D5016 100%)" }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #C9A84C 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Social links */}
          <div className="flex justify-center gap-6 mb-10">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="text-cream/50 hover:text-gold transition-colors text-sm font-body flex items-center gap-1.5"
              >
                <Icon />
                <span className="hidden sm:inline">{label}</span>
              </a>
            ))}
          </div>

          <p className="text-gold text-sm font-body font-semibold tracking-widest uppercase mb-4">
            Welcome to
          </p>
          <h1 className="font-heading text-5xl sm:text-7xl text-cream font-bold leading-tight mb-4">
            UCM Scribe
          </h1>
          <p className="text-cream/70 font-body text-lg sm:text-xl leading-relaxed max-w-xl mx-auto mb-10">
            Grow in faith. Engage with God&apos;s Word. Celebrate your community.
            Track your spiritual journey.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gold text-navy-dark font-body font-semibold px-8 py-3 rounded-full hover:bg-gold-light transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-gold text-navy-dark font-body font-semibold px-8 py-3 rounded-full hover:bg-gold-light transition-colors"
                >
                  Join the Community
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border border-cream/30 text-cream font-body px-6 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-6 mb-14">
            {[
              { href: "/sermons", label: "📖 Sermons" },
              { href: "/devotionals", label: "🕊️ Devotionals" },
              { href: "/bible-study", label: "✝️ Bible Study" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={user ? href : "/login"}
                className="text-sm text-cream/60 hover:text-gold font-body transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Latest quote */}
          {latestQuote && (
            <div className="border border-gold/30 rounded-2xl px-8 py-6 text-left max-w-xl mx-auto bg-white/5">
              <p className="font-heading text-xl text-cream italic leading-relaxed">
                &ldquo;{latestQuote.text}&rdquo;
              </p>
              <p className="text-gold text-sm font-body mt-3 font-medium">— {latestQuote.author}</p>
            </div>
          )}
        </div>

        {/* Scroll chevron */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce text-cream/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="bg-cream py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl text-navy font-bold mb-3">
              Everything Your Faith Journey Needs
            </h2>
            <p className="text-navy/60 font-body text-lg max-w-xl mx-auto">
              One platform. All the resources, community, and tools to help you grow in faith.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "📖", title: "Sermon Library", desc: "Access powerful messages from our pastors, anytime, anywhere." },
              { icon: "✝️", title: "Bible Study Notes", desc: "Deepen your understanding with structured, topic-based study notes." },
              { icon: "🕊️", title: "Daily Devotionals", desc: "Start each day grounded in faith with a fresh devotional guide." },
              { icon: "📣", title: "Announcements", desc: "Never miss church events, meetings, or urgent updates." },
              { icon: "🏆", title: "Points & Rewards", desc: "Earn points for engagement. Climb the leaderboard. Be celebrated." },
              { icon: "🌱", title: "Evangelism Tracking", desc: "Record souls won and track the growth of God's kingdom." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-cream-dark p-6">
                <span className="text-3xl block mb-3">{icon}</span>
                <h3 className="font-heading text-lg text-navy font-semibold mb-2">{title}</h3>
                <p className="text-sm text-navy/60 font-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEADERBOARD PREVIEW ─── */}
      {weeklyTop5.length > 0 && (
        <section className="bg-navy py-20 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-heading text-3xl text-cream font-bold mb-2">
              🏆 This Week&apos;s Champions
            </h2>
            <p className="text-cream/50 font-body mb-10">
              Members leading in spiritual engagement this week.
            </p>
            <div className="space-y-3">
              {weeklyTop5.map((entry, i) => (
                <div
                  key={entry.name}
                  className={`flex items-center gap-4 rounded-xl px-5 py-3 ${
                    i === 0
                      ? "bg-gold/20 border border-gold/40"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <span className="text-xl">
                    {["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}
                  </span>
                  <span className="flex-1 text-left font-body text-cream">{entry.name}</span>
                  <span
                    className={`font-heading font-bold ${
                      i === 0 ? "shimmer-gold" : "text-cream/70"
                    }`}
                  >
                    {entry.points.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={user ? "/leaderboard" : "/login"}
              className="inline-block mt-6 text-gold hover:underline font-body text-sm"
            >
              See Full Leaderboard →
            </Link>
          </div>
        </section>
      )}

      {/* ─── LATEST CONTENT ─── */}
      <section className="bg-cream-light py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl text-navy font-bold text-center mb-10">
            Latest Content
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                label: "Latest Sermon",
                icon: "📖",
                title: latestSermon?.title,
                subtitle: latestSermon?.preacher,
                date: latestSermon?.publishedAt,
                href: "/sermons",
                accent: "border-l-navy",
              },
              {
                label: "Today's Devotional",
                icon: "🕊️",
                title: latestDevotional?.title,
                subtitle: latestDevotional?.verse,
                date: latestDevotional?.scheduledAt,
                href: "/devotionals",
                accent: "border-l-forest",
              },
              {
                label: "Bible Study",
                icon: "✝️",
                title: latestBibleStudy?.title,
                subtitle: latestBibleStudy?.topic,
                date: latestBibleStudy?.publishedAt,
                href: "/bible-study",
                accent: "border-l-gold",
              },
            ].map((card) => (
              <Link key={card.label} href={user ? card.href : "/login"}>
                <div
                  className={`bg-white border border-cream-dark rounded-xl border-l-4 ${card.accent} p-6 h-full hover:shadow-md transition-all`}
                >
                  <p className="text-2xl mb-3">{card.icon}</p>
                  <p className="text-xs text-navy/50 font-body font-medium uppercase tracking-wider mb-2">
                    {card.label}
                  </p>
                  <h3 className="font-heading text-base font-semibold text-navy leading-snug mb-1">
                    {card.title ?? "Coming soon"}
                  </h3>
                  {card.subtitle && (
                    <p className="text-xs text-navy/60 font-body">{card.subtitle}</p>
                  )}
                  {card.date && (
                    <p className="text-xs text-gray-400 font-body mt-2">
                      {format(new Date(card.date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      {!user && (
        <section className="bg-burgundy py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl text-cream font-bold mb-4">
              Join Our Growing Community
            </h2>
            <p className="text-cream/70 font-body text-lg mb-8">
              Access sermons, devotionals, Bible study notes, and connect with fellow believers.
              It&apos;s free.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gold text-navy-dark font-body font-semibold px-10 py-4 rounded-full hover:bg-gold-light transition-colors text-lg"
            >
              Join UCM Scribe Today →
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
