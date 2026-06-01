import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy text-cream/60 py-8 px-4 mt-auto">
      <div className="max-w-5xl mx-auto text-center">
        <p className="font-heading text-gold text-lg font-semibold mb-1">UCM Scribe</p>
        <p className="text-sm font-body">Grow in faith. Engage in community. Shine your light.</p>
        <div className="flex justify-center gap-6 mt-4 text-xs font-body">
          <Link href="/sermons" className="hover:text-gold transition-colors">Sermons</Link>
          <Link href="/devotionals" className="hover:text-gold transition-colors">Devotionals</Link>
          <Link href="/bible-study" className="hover:text-gold transition-colors">Bible Study</Link>
          <Link href="/leaderboard" className="hover:text-gold transition-colors">Leaderboard</Link>
        </div>
        <p className="text-xs mt-6 text-cream/30 font-body">© {new Date().getFullYear()} UCM Scribe. All rights reserved.</p>
      </div>
    </footer>
  );
}
