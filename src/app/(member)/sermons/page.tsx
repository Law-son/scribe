import Link from "next/link";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export const metadata = { title: "Sermons" };

async function SermonList({ search }: { search: string }) {
  await connectDB();
  const query: Record<string, unknown> = { status: "published" };
  if (search) query.$text = { $search: search };

  const sermons = await Sermon.find(query)
    .sort({ publishedAt: -1 })
    .limit(20)
    .select("title preacher date publishedAt likesCount viewsCount tags")
    .lean();

  if (sermons.length === 0) {
    return <p className="text-center text-navy/50 font-body py-16">No sermons found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sermons.map((s) => (
        <Link key={s._id.toString()} href={`/sermons/${s._id}`}>
          <div className="bg-white border border-cream-dark rounded-xl p-6 hover:border-navy/30 hover:shadow-md transition-all h-full">
            <div className="flex flex-wrap gap-2 mb-3">
              {s.tags?.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="navy">{tag}</Badge>
              ))}
            </div>
            <h2 className="font-heading text-lg font-semibold text-navy mb-1 leading-snug">{s.title}</h2>
            <p className="text-sm text-navy/60 font-body">{s.preacher}</p>
            <p className="text-xs text-gray-400 font-body mt-1">
              {format(new Date(s.date ?? s.publishedAt ?? s.createdAt), "MMMM d, yyyy")}
            </p>
            <div className="flex gap-4 mt-4 text-xs text-gray-400 font-body">
              <span>👁 {s.viewsCount ?? 0}</span>
              <span>❤️ {s.likesCount ?? 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function SermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Sermons</h1>
        <p className="text-navy/60 font-body mt-1">Messages to inspire and strengthen your faith.</p>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search sermons…"
            className="flex-1 h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button
            type="submit"
            className="h-10 px-4 bg-navy text-cream rounded-lg text-sm font-body hover:bg-navy-light transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <Suspense fallback={<p className="text-center py-12 text-navy/40 font-body">Loading…</p>}>
        <SermonList search={search} />
      </Suspense>
    </div>
  );
}
