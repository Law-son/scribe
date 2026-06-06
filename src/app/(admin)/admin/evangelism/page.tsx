import connectDB from "@/lib/db";
import Convert from "@/models/Convert";
import { format } from "date-fns";

export const metadata = { title: "Evangelism" };

export default async function AdminEvangelismPage() {
  await connectDB();
  const converts = await Convert.find()
    .sort({ createdAt: -1 })
    .populate("registeredBy", "name")
    .lean();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Evangelism</h1>
        <p className="text-navy/60 font-body mt-1">{converts.length} converts registered</p>
      </div>

      {converts.length === 0 ? (
        <p className="text-navy/40 font-body text-sm">No converts registered yet.</p>
      ) : (
        <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream-light border-b border-cream-dark">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden md:table-cell">Registered By</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {converts.map((c) => (
                <tr key={c._id.toString()} className="hover:bg-cream-light/50">
                  <td className="px-5 py-3 text-sm font-body font-medium text-navy">{c.name}</td>
                  <td className="px-5 py-3 text-sm text-navy/50 font-body hidden sm:table-cell">{c.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-navy/60 font-body hidden md:table-cell">
                    {(c.registeredBy as unknown as { name?: string })?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-navy/50 font-body">
                    {format(new Date(c.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
