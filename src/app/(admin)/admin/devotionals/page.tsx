import Link from "next/link";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { ApproveDevotionalButton } from "./ApproveDevotionalButton";

export const metadata = { title: "Manage Devotionals" };

export default async function AdminDevotionalsPage() {
  await connectDB();
  const devotionals = await Devotional.find().sort({ createdAt: -1 }).limit(50).lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Devotionals</h1>
          <p className="text-navy/60 font-body mt-1">{devotionals.length} total</p>
        </div>
        <Link href="/admin/devotionals/new" className="inline-flex items-center gap-2 bg-navy text-cream font-body text-sm px-4 py-2 rounded-lg hover:bg-navy-light transition-colors">
          + New Devotional
        </Link>
      </div>
      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
        {devotionals.length === 0 ? (
          <p className="text-center text-navy/50 font-body py-12">No devotionals yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-cream-light border-b border-cream-dark">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider hidden sm:table-cell">Scheduled</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {devotionals.map((d) => (
                <tr key={d._id.toString()} className="hover:bg-cream-light/50">
                  <td className="px-5 py-4 font-body font-medium text-navy text-sm">{d.title}</td>
                  <td className="px-5 py-4 text-sm text-navy/60 font-body hidden sm:table-cell">
                    {format(new Date(d.scheduledAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={d.status === "approved" ? "green" : d.status === "rejected" ? "burgundy" : "gold"}>
                      {d.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right flex items-center justify-end gap-3">
                    {d.status === "pending" && (
                      <ApproveDevotionalButton id={d._id.toString()} />
                    )}
                    <Link href={`/admin/devotionals/${d._id}/edit`} className="text-sm text-gold-dark hover:underline font-body">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
