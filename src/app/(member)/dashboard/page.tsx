import { headers } from "next/headers";
import Link from "next/link";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Sermon from "@/models/Sermon";
import Devotional from "@/models/Devotional";
import BibleStudy from "@/models/BibleStudy";
import Quote from "@/models/Quote";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export default async function DashboardPage() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id")!;
  const userName = headersList.get("x-user-name") ?? "Member";

  await connectDB();
  const now = new Date();

  const [user, latestSermon, latestDevotional, latestBibleStudy, latestQuote] = await Promise.all([
    User.findById(userId).select("totalPoints name createdAt").lean(),
    Sermon.findOne({ status: "published" }).sort({ publishedAt: -1 }).select("title preacher publishedAt").lean(),
    Devotional.findOne({ status: "approved", scheduledAt: { $lte: now } }).sort({ scheduledAt: -1 }).select("title verse scheduledAt").lean(),
    BibleStudy.findOne({ status: "published" }).sort({ publishedAt: -1 }).select("title topic publishedAt").lean(),
    Quote.findOne({ status: "published" }).sort({ createdAt: -1 }).select("text author").lean(),
  ]);

  const contentCards = [
    {
      label: "Latest Sermon",
      icon: "📖",
      title: latestSermon?.title ?? "No sermons yet",
      subtitle: latestSermon?.preacher,
      date: latestSermon?.publishedAt,
      href: latestSermon ? `/sermons/${latestSermon._id}` : "/sermons",
      color: "border-l-navy",
    },
    {
      label: "Today's Devotional",
      icon: "🕊️",
      title: latestDevotional?.title ?? "No devotional today",
      subtitle: latestDevotional?.verse,
      date: latestDevotional?.scheduledAt,
      href: latestDevotional ? `/devotionals/${latestDevotional._id}` : "/devotionals",
      color: "border-l-forest",
    },
    {
      label: "Bible Study",
      icon: "✝️",
      title: latestBibleStudy?.title ?? "No notes yet",
      subtitle: latestBibleStudy?.topic,
      date: latestBibleStudy?.publishedAt,
      href: latestBibleStudy ? `/bible-study/${latestBibleStudy._id}` : "/bible-study",
      color: "border-l-burgundy",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">
          Good day, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-navy/60 font-body mt-1">Continue your spiritual journey today.</p>
      </div>

      {/* Points banner */}
      <div className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-5 mb-8 text-cream flex items-center justify-between">
        <div>
          <p className="text-cream/60 text-sm font-body">Your Points</p>
          <p className="font-heading text-4xl font-bold text-gold">{user?.totalPoints?.toLocaleString() ?? 0}</p>
        </div>
        <div className="text-right">
          <Link href="/leaderboard" className="text-sm text-gold hover:underline font-body">
            See Leaderboard →
          </Link>
          <p className="text-xs text-cream/40 mt-1 font-body">
            Member since {format(new Date(user?.createdAt ?? Date.now()), "MMM yyyy")}
          </p>
        </div>
      </div>

      {/* Latest content grid */}
      <h2 className="font-heading text-xl text-navy font-semibold mb-4">Latest Content</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {contentCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card hover className={`h-full border-l-4 ${card.color}`}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{card.icon}</span>
                  <Badge variant="navy">{card.label}</Badge>
                </div>
                <h3 className="font-heading text-base font-semibold text-navy leading-snug mb-1">
                  {card.title}
                </h3>
                {card.subtitle && <p className="text-xs text-navy/60 font-body">{card.subtitle}</p>}
                {card.date && (
                  <p className="text-xs text-gray-400 font-body mt-2">
                    {format(new Date(card.date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quote of the day */}
      {latestQuote && (
        <div className="bg-cream border border-gold/30 rounded-2xl p-6 mb-8">
          <p className="font-heading text-lg text-navy-dark italic leading-relaxed">
            &ldquo;{latestQuote.text}&rdquo;
          </p>
          <p className="text-sm text-gold-dark font-body mt-3 font-medium">— {latestQuote.author}</p>
        </div>
      )}

      {/* Quick links */}
      <h2 className="font-heading text-xl text-navy font-semibold mb-4">Quick Access</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/sermons", label: "All Sermons", icon: "📖" },
          { href: "/devotionals", label: "Devotionals", icon: "🕊️" },
          { href: "/evangelism", label: "Evangelism", icon: "🌱" },
          { href: "/announcements", label: "Announcements", icon: "📣" },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-cream-dark rounded-xl p-4 text-center hover:border-navy/30 hover:shadow-sm transition-all"
          >
            <span className="text-2xl block mb-2">{icon}</span>
            <span className="text-xs font-body text-navy font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
