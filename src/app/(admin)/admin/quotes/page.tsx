import Link from "next/link";
import connectDB from "@/lib/db";
import Quote from "@/models/Quote";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Manage Quotes" };

export default async function AdminQuotesPage() {
  await connectDB();
  const quotes = await Quote.find().sort({ createdAt: -1 }).limit(50).lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Quotes</h1>
          <p className="text-navy/60 font-body mt-1">{quotes.length} total</p>
        </div>
        <Link href="/admin/quotes/new" className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">
          + New Quote
        </Link>
      </div>
      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
        {quotes.length === 0 ? <p className="text-center text-navy/50 font-body py-12">No quotes yet.</p> : (
          <table className="w-full">
            <thead className="bg-cream-light border-b border-cream-dark">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Quote</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden sm:table-cell">Author</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {quotes.map((q) => (
                <tr key={q._id.toString()} className="hover:bg-cream-light/50">
                  <td className="px-5 py-4 text-sm text-navy font-body italic max-w-xs truncate">&ldquo;{q.text}&rdquo;</td>
                  <td className="px-5 py-4 text-sm text-navy/60 font-body hidden sm:table-cell">{q.author}</td>
                  <td className="px-5 py-4"><Badge variant={q.status === "published" ? "green" : "gray"}>{q.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
