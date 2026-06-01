import Link from "next/link";
import connectDB from "@/lib/db";
import BibleStudy from "@/models/BibleStudy";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export const metadata = { title: "Bible Study" };

export default async function BibleStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  await connectDB();

  const query: Record<string, unknown> = { status: "published" };
  if (search) query.$text = { $search: search };

  const notes = await BibleStudy.find(query)
    .sort({ publishedAt: -1 })
    .limit(20)
    .select("title topic date category publishedAt likesCount viewsCount")
    .lean();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Bible Study Notes</h1>
        <p className="text-navy/60 font-body mt-1">Deepen your understanding of Scripture.</p>
      </div>

      <form className="mb-6">
        <div className="flex gap-2">
          <input name="search" defaultValue={search} placeholder="Search notes…" className="flex-1 h-10 rounded-lg border border-cream-dark bg-white px-4 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy" />
          <button type="submit" className="h-10 px-4 bg-navy text-cream rounded-lg text-sm font-body hover:bg-navy-light transition-colors">Search</button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-center text-navy/50 font-body py-16">No notes found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((n) => (
            <Link key={n._id.toString()} href={`/bible-study/${n._id}`}>
              <div className="bg-white border border-cream-dark rounded-xl p-6 hover:border-navy/30 hover:shadow-md transition-all h-full border-l-4 border-l-forest">
                {n.category && <Badge variant="green" className="mb-3">{n.category}</Badge>}
                <h2 className="font-heading text-lg font-semibold text-navy mb-1 leading-snug">{n.title}</h2>
                <p className="text-sm text-navy/60 font-body">{n.topic}</p>
                <p className="text-xs text-gray-400 font-body mt-1">
                  {format(new Date(n.date ?? n.publishedAt), "MMMM d, yyyy")}
                </p>
                <div className="flex gap-4 mt-4 text-xs text-gray-400 font-body">
                  <span>👁 {n.viewsCount ?? 0}</span>
                  <span>❤️ {n.likesCount ?? 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
