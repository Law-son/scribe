import connectDB from "@/lib/db";
import Convert from "@/models/Convert";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { VerifyConvertButton } from "./VerifyConvertButton";

export const metadata = { title: "Evangelism" };

export default async function AdminEvangelismPage() {
  await connectDB();
  const converts = await Convert.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("registeredBy", "name")
    .lean();

  const pending = converts.filter((c) => c.status === "pending");
  const verified = converts.filter((c) => c.status === "verified");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Evangelism</h1>
        <p className="text-navy/60 font-body mt-1">
          {pending.length} pending · {verified.length} verified
        </p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl text-navy font-semibold mb-4">Pending Verification</h2>
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c._id.toString()} className="bg-white border border-gold/30 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-semibold text-navy">{c.name}</p>
                    {c.phone && <p className="text-sm text-navy/50 font-body">{c.phone}</p>}
                    {c.address && <p className="text-sm text-navy/50 font-body">{c.address}</p>}
                    <p className="text-xs text-navy/40 font-body mt-1">
                      Registered by{" "}
                      <span className="font-medium text-navy/60">
                        {(c.registeredBy as unknown as { name?: string })?.name ?? "Unknown"}
                      </span>{" "}
                      · {format(new Date(c.createdAt), "MMM d, yyyy")}
                    </p>
                    {c.notes && <p className="text-xs text-navy/50 font-body mt-1 italic">{c.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <VerifyConvertButton id={c._id.toString()} action="verify" />
                    <VerifyConvertButton id={c._id.toString()} action="reject" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-heading text-xl text-navy font-semibold mb-4">Verified Converts</h2>
        {verified.length === 0 ? (
          <p className="text-navy/40 font-body text-sm">No verified converts yet.</p>
        ) : (
          <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-cream-light border-b border-cream-dark">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden sm:table-cell">Registered By</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {verified.map((c) => (
                  <tr key={c._id.toString()} className="hover:bg-cream-light/50">
                    <td className="px-5 py-3 text-sm font-body text-navy">{c.name}</td>
                    <td className="px-5 py-3 text-sm text-navy/60 font-body hidden sm:table-cell">
                      {(c.registeredBy as unknown as { name?: string })?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-navy/50 font-body">
                      {format(new Date(c.verifiedAt ?? c.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3"><Badge variant="green">Verified</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
