import { headers } from "next/headers";
import Link from "next/link";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Sermon from "@/models/Sermon";
import Devotional from "@/models/Devotional";
import BibleStudy from "@/models/BibleStudy";
import Quote from "@/models/Quote";
import { format } from "date-fns";

function getGreeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return { word: "Good morning", icon: "🌅" };
  if (h < 17) return { word: "Good afternoon", icon: "☀️" };
  return { word: "Good evening", icon: "🌙" };
}

export default async function DashboardPage() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id")!;
  const userName = headersList.get("x-user-name") ?? "Member";
  const { word: greeting } = getGreeting();

  await connectDB();
  const now = new Date();

  const [user, latestSermon, latestDevotional, latestBibleStudy, latestQuote] = await Promise.all([
    User.findById(userId).select("totalPoints name createdAt").lean(),
    Sermon.findOne({ status: "published" }).sort({ publishedAt: -1 }).select("title preacher publishedAt").lean(),
    Devotional.findOne({ status: "approved", scheduledAt: { $lte: now } }).sort({ scheduledAt: -1 }).select("title verse scheduledAt").lean(),
    BibleStudy.findOne({ status: "published" }).sort({ publishedAt: -1 }).select("title topic publishedAt").lean(),
    Quote.findOne({ status: "published" }).sort({ createdAt: -1 }).select("text author").lean(),
  ]);

  const firstName = userName.split(" ")[0];
  const points = user?.totalPoints ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <p className="text-navy/50 font-body text-sm mb-1">{format(now, "EEEE, MMMM d")}</p>
        <h1 className="font-heading text-3xl text-navy font-bold leading-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-navy/50 font-body mt-1 text-sm">Your spiritual journey continues today.</p>
      </div>

      {/* ── Points strip ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-5 flex items-center justify-between">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-16 w-24 h-24 rounded-full bg-gold/10 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-cream/50 text-xs font-body uppercase tracking-widest mb-1">Your Points</p>
          <p className="font-heading text-5xl font-bold text-gold leading-none">{points.toLocaleString()}</p>
        </div>

        <div className="relative z-10 text-right">
          {/* Trophy SVG */}
          <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mb-2 ml-auto">
            <svg className="w-7 h-7 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
          </div>
          <Link href="/leaderboard" className="text-xs text-gold/70 hover:text-gold font-body transition-colors">
            Leaderboard →
          </Link>
        </div>
      </div>

      {/* ── Latest Content ───────────────────────────────────── */}
      <div>
        <h2 className="font-heading text-lg text-navy font-semibold mb-4">Latest Content</h2>

        <div className="space-y-3">

          {/* Sermon card — dark dramatic */}
          <Link href={latestSermon ? `/sermons/${latestSermon._id}` : "/sermons"} className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-navy min-h-[110px] flex items-center px-6 py-5">
              {/* background cross motif */}
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 text-white/5" viewBox="0 0 100 100" fill="currentColor">
                <rect x="42" y="5" width="16" height="90" rx="4"/>
                <rect x="5" y="35" width="90" height="16" rx="4"/>
              </svg>

              {/* icon bubble */}
              <div className="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0 mr-4">
                <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-gold/70 text-xs font-body uppercase tracking-widest mb-0.5">Latest Sermon</p>
                <p className="font-heading text-cream font-semibold text-base leading-snug truncate">
                  {latestSermon?.title ?? "No sermons yet"}
                </p>
                {latestSermon?.preacher && (
                  <p className="text-cream/50 text-xs font-body mt-0.5">{latestSermon.preacher}</p>
                )}
              </div>

              <svg className="w-5 h-5 text-cream/30 group-hover:text-gold/60 transition-colors ml-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </Link>

          {/* Devotional + Bible Study — side by side */}
          <div className="grid grid-cols-2 gap-3">

            {/* Devotional — warm ivory */}
            <Link href={latestDevotional ? `/devotionals/${latestDevotional._id}` : "/devotionals"} className="group block">
              <div className="relative overflow-hidden rounded-2xl bg-cream border border-cream-dark h-full p-5">
                {/* leaf motif */}
                <svg className="absolute -bottom-3 -right-3 w-20 h-20 text-forest/8" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M90 10 C90 10 10 20 20 90 C20 90 80 70 90 10Z"/>
                </svg>

                <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  </svg>
                </div>

                <p className="text-forest/70 text-xs font-body uppercase tracking-widest mb-1">Devotional</p>
                <p className="font-heading text-navy font-semibold text-sm leading-snug line-clamp-2 relative z-10">
                  {latestDevotional?.title ?? "No devotional today"}
                </p>
                {latestDevotional?.verse && (
                  <p className="text-navy/40 text-xs font-body mt-1 truncate relative z-10">{latestDevotional.verse}</p>
                )}
              </div>
            </Link>

            {/* Bible Study — burgundy accent */}
            <Link href={latestBibleStudy ? `/bible-study/${latestBibleStudy._id}` : "/bible-study"} className="group block">
              <div className="relative overflow-hidden rounded-2xl bg-burgundy h-full p-5">
                {/* ornament */}
                <svg className="absolute -top-4 -right-4 w-20 h-20 text-white/5" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="4"/>
                </svg>

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
                    <path d="m9 10 2 2 4-4"/>
                  </svg>
                </div>

                <p className="text-cream/50 text-xs font-body uppercase tracking-widest mb-1">Bible Study</p>
                <p className="font-heading text-cream font-semibold text-sm leading-snug line-clamp-2 relative z-10">
                  {latestBibleStudy?.title ?? "No notes yet"}
                </p>
                {latestBibleStudy?.topic && (
                  <p className="text-cream/40 text-xs font-body mt-1 truncate relative z-10">{latestBibleStudy.topic}</p>
                )}
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* ── Quote of the day ─────────────────────────────────── */}
      {latestQuote && (
        <div className="relative rounded-2xl bg-gradient-to-br from-ivory to-cream border border-gold/20 px-8 py-7">
          {/* giant quotation mark */}
          <svg className="absolute top-4 left-5 w-10 h-10 text-gold/20" viewBox="0 0 40 40" fill="currentColor">
            <path d="M0 28 C0 18 6 10 18 6 L20 10 C14 13 11 17 11 22 C11 22 13 22 14 22 C17 22 20 25 20 29 C20 33 17 36 13 36 C6 36 0 33 0 28 Z M20 28 C20 18 26 10 38 6 L40 10 C34 13 31 17 31 22 C31 22 33 22 34 22 C37 22 40 25 40 29 C40 33 37 36 33 36 C26 36 20 33 20 28 Z"/>
          </svg>
          <p className="font-heading text-navy-dark text-lg italic leading-relaxed pl-6 relative z-10">
            {latestQuote.text}
          </p>
          <div className="flex items-center gap-2 mt-4 pl-6">
            <div className="h-px w-8 bg-gold/40" />
            <p className="text-gold-dark text-sm font-body font-medium">{latestQuote.author}</p>
          </div>
        </div>
      )}

      {/* ── Quick Access ─────────────────────────────────────── */}
      <div>
        <h2 className="font-heading text-lg text-navy font-semibold mb-4">Explore</h2>
        <div className="grid grid-cols-4 gap-3">

          {/* Sermons */}
          <Link href="/sermons" className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-cream-dark hover:border-navy/20 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-xl bg-navy/8 group-hover:bg-navy/12 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <span className="text-xs font-body text-navy font-medium text-center leading-tight">Sermons</span>
          </Link>

          {/* Devotionals */}
          <Link href="/devotionals" className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-cream-dark hover:border-forest/30 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-xl bg-forest/8 group-hover:bg-forest/12 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              </svg>
            </div>
            <span className="text-xs font-body text-navy font-medium text-center leading-tight">Devotionals</span>
          </Link>

          {/* Evangelism */}
          <Link href="/evangelism" className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-cream-dark hover:border-gold/40 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-xl bg-gold/8 group-hover:bg-gold/15 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-gold-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l19-9-9 19-2-8-8-2z"/>
              </svg>
            </div>
            <span className="text-xs font-body text-navy font-medium text-center leading-tight">Evangelism</span>
          </Link>

          {/* Announcements */}
          <Link href="/announcements" className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-cream-dark hover:border-burgundy/30 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-xl bg-burgundy/8 group-hover:bg-burgundy/12 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-burgundy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span className="text-xs font-body text-navy font-medium text-center leading-tight">Notices</span>
          </Link>

        </div>
      </div>

    </div>
  );
}
