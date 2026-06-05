import Link from "next/link";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import { Badge } from "@/components/ui/Badge";
import { TablePagination } from "@/components/ui/TablePagination";
export const metadata = { title: "Manage Devotionals" };

const PAGE_SIZE = 20;

export default async function AdminDevotionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  await connectDB();
  const [devotionals, total] = await Promise.all([
    Devotional.find().sort({ dayNumber: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
    Devotional.countDocuments(),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Devotionals</h1>
          <p className="text-navy/60 font-body mt-1">{total} total</p>
        </div>
        <Link href="/admin/devotionals/new" className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">
          + New Devotional
        </Link>
      </div>
      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
        {devotionals.length === 0 ? (
          <p className="text-center text-navy/50 font-body py-12">No devotionals yet.</p>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-cream-light border-b border-cream-dark">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Topic</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider hidden sm:table-cell">Day / Week</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {devotionals.map((d, i) => (
                  <tr key={d._id.toString()} className="hover:bg-cream-light/50">
                    <td className="px-5 py-4 text-xs text-navy/40 font-body tabular-nums">{skip + i + 1}</td>
                    <td className="px-5 py-4 font-body font-medium text-navy text-sm">{d.topic ?? d.title}</td>
                    <td className="px-5 py-4 text-sm text-navy/60 font-body hidden sm:table-cell">
                      {d.dayNumber ? (
                        <span>Day {d.dayNumber} · Week {d.weekNumber ?? "—"}</span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={
                        d.status === "approved" ? "green" :
                        d.status === "rejected" ? "burgundy" :
                        d.status === "draft" ? "gray" : "gold"
                      }>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/devotionals/${d._id}/edit`} className="text-sm text-gold-dark hover:underline font-body">Edit</Link>
                    </td>
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
