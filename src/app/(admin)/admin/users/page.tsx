import Link from "next/link";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserActions } from "@/components/admin/UserActions";
import { UsersSearch } from "./UsersSearch";
import { format } from "date-fns";

export const metadata = { title: "Members" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  await connectDB();

  const query: Record<string, unknown> = {};
  if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];

  const users = await User.find(query).sort({ createdAt: -1 }).limit(50).select("-password").lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-navy font-bold">Members</h1>
          <p className="text-navy/60 font-body mt-1">{users.length} shown</p>
        </div>
        <Link href="/admin/users/import">
          <Button type="button" variant="secondary">Bulk Import</Button>
        </Link>
      </div>

      <UsersSearch initialValue={search} />

      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cream-light border-b border-cream-dark">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Name</th>
              <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden sm:table-cell">Phone</th>
              <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden md:table-cell">Points</th>
              <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden md:table-cell">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dark">
            {users.map((u) => (
              <tr key={u._id.toString()} className="hover:bg-cream-light/50">
                <td className="px-5 py-3 text-sm font-body font-medium text-navy flex items-center gap-2">
                  {u.name}
                  {!u.isActive && <Badge variant="burgundy">Suspended</Badge>}
                </td>
                <td className="px-5 py-3 text-sm text-navy/60 font-body hidden sm:table-cell">{u.phone}</td>
                <td className="px-5 py-3">
                  <Badge variant={u.role === "admin" ? "gold" : "navy"}>{u.role}</Badge>
                </td>
                <td className="px-5 py-3 text-sm text-navy font-body hidden md:table-cell">{u.totalPoints.toLocaleString()}</td>
                <td className="px-5 py-3 text-sm text-navy/50 font-body hidden md:table-cell">
                  {format(new Date(u.createdAt), "MMM d, yyyy")}
                </td>
                <td className="px-5 py-3 text-right">
                  <UserActions id={u._id.toString()} name={u.name} editHref={`/admin/users/${u._id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
