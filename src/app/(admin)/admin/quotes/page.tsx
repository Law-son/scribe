import Link from "next/link";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import Quote from "@/models/Quote";
import { Badge } from "@/components/ui/Badge";
import { TablePagination } from "@/components/ui/TablePagination";

export const metadata = { title: "Manage Quotes" };

const PAGE_SIZE = 20;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  await connectDB();
  const [quotes, total] = await Promise.all([
    Quote.find().sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
    Quote.countDocuments(),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Quotes</h1>
          <p className="text-navy/60 font-body mt-1">{total} total</p>
        </div>
        <Link href="/admin/quotes/new" className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">
          + New Quote
        </Link>
      </div>
      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
        {quotes.length === 0 ? (
          <p className="text-center text-navy/50 font-body py-12">No quotes yet.</p>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-cream-light border-b border-cream-dark">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Quote</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden sm:table-cell">Author</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {quotes.map((q, i) => (
                  <tr key={q._id.toString()} className="hover:bg-cream-light/50">
                    <td className="px-5 py-4 text-xs text-navy/40 font-body tabular-nums">{skip + i + 1}</td>
                    <td className="px-5 py-4 text-sm text-navy font-body italic max-w-xs truncate">&ldquo;{q.text}&rdquo;</td>
                    <td className="px-5 py-4 text-sm text-navy/60 font-body hidden sm:table-cell">{q.author}</td>
                    <td className="px-5 py-4"><Badge variant={q.status === "published" ? "green" : "gray"}>{q.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Suspense>
              <TablePagination currentPage={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
