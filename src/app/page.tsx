import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import Devotional from "@/models/Devotional";
import BibleStudy from "@/models/BibleStudy";
import Quote from "@/models/Quote";
import PointTransaction from "@/models/PointTransaction";
import SiteSettings from "@/models/SiteSettings";
import { getCurrentUser } from "@/lib/auth";
import { format, startOfWeek } from "date-fns";
import { Footer } from "@/components/layout/Footer";
import { SocialLinksDisplay, type SocialLinkItem } from "@/components/content/SocialLinksDisplay";


export default async function HomePage() {
  const user = await getCurrentUser();

  // Logged-in users skip the landing page entirely
  if (user) redirect("/dashboard");

  let latestQuote = null;
  let latestSermon = null;
  let latestDevotional = null;
  let latestBibleStudy = null;
  let weeklyTop5: { name: string; points: number }[] = [];
  let socialLinks: SocialLinkItem[] = [];

  try {
    await connectDB();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const [q, s, d, bs, top5, settings] = await Promise.all([
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
      SiteSettings.findOne({ key: "main" }).select("socialLinks customSocialLinks").lean(),
    ]);

    latestQuote = q;
    latestSermon = s;
    latestDevotional = d;
    latestBibleStudy = bs;
    weeklyTop5 = top5;

    const sl = settings?.socialLinks ?? {};
    const corePlatforms = [
      { platform: "tiktok", label: "TikTok", url: sl.tiktok ?? "" },
      { platform: "whatsapp", label: "WhatsApp", url: sl.whatsapp ?? "" },
      { platform: "facebook", label: "Facebook", url: sl.facebook ?? "" },
      { platform: "instagram", label: "Instagram", url: sl.instagram ?? "" },
    ];
    const custom = (settings?.customSocialLinks ?? []).map((c) => ({
      platform: c.platform,
      label: c.label,
      url: c.url,
    }));
    socialLinks = [...corePlatforms, ...custom].filter((l) => l.url);
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
          {socialLinks.length > 0 && (
            <div className="flex justify-center mb-10">
              <SocialLinksDisplay links={socialLinks} variant="dark" showLabel />
            </div>
          )}

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
