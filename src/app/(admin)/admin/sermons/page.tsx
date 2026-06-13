import Link from "next/link";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import { Badge } from "@/components/ui/Badge";
import { TablePagination } from "@/components/ui/TablePagination";
import { ContentActions } from "@/components/admin/ContentActions";
import { EditLink } from "@/components/admin/EditLink";
import { format } from "date-fns";

export const metadata = { title: "Manage Sermons" };

const PAGE_SIZE = 20;

export default async function AdminSermonsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  await connectDB();
  const [sermons, total] = await Promise.all([
    Sermon.find().sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
    Sermon.countDocuments(),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Sermons</h1>
          <p className="text-navy/60 font-body mt-1">{total} total</p>
        </div>
        <Link
          href="/admin/sermons/new"
          className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors"
        >
          + New Sermon
        </Link>
      </div>

      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
        {sermons.length === 0 ? (
          <p className="text-center text-navy/50 font-body py-12">No sermons yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-light border-b border-cream-dark">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider hidden sm:table-cell">Preacher</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {sermons.map((s, i) => (
                  <tr key={s._id.toString()} className="hover:bg-cream-light/50 transition-colors">
                    <td className="px-5 py-4 text-xs text-navy/40 font-body tabular-nums">{skip + i + 1}</td>
                    <td className="px-5 py-4 font-body font-medium text-navy text-sm">{s.title}</td>
                    <td className="px-5 py-4 text-sm text-navy/60 font-body hidden sm:table-cell">{s.preacher}</td>
                    <td className="px-5 py-4">
                      <Badge variant={s.status === "published" ? "green" : "gray"}>{s.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-navy/50 font-body hidden md:table-cell">
                      {format(new Date(s.date ?? s.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <EditLink href={`/admin/sermons/${s._id}/edit`} />
                        <ContentActions
                          id={s._id.toString()}
                          apiBase="/api/sermons"
                          status={s.status}
                          label={s.title}
                          previewHref={`/sermons/${s._id}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <Suspense>
              <TablePagination currentPage={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
