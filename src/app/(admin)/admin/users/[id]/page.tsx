"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: "", role: "member", isActive: true, location: "", membershipType: "member" });

  useEffect(() => {
    fetch(`/api/admin/users/${id}`).then((r) => r.json()).then((data) => {
      setForm({ name: data.name ?? "", role: data.role ?? "member", isActive: data.isActive ?? true, location: data.location ?? "", membershipType: data.membershipType ?? "member" });
      setFetching(false);
    });
  }, [id]);

  function set(k: string, v: string | boolean) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("User updated!"); router.push("/admin/users"); }
    else toast.error("Failed to update");
    setLoading(false);
  }

  if (fetching) return <PageLoader />;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/users" className="text-navy/50 hover:text-navy font-body text-sm">← Members</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">Edit Member</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" value={form.role} onChange={(e) => set("role", e.target.value)} options={[{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }]} />
            <Select label="Membership Type" value={form.membershipType} onChange={(e) => set("membershipType", e.target.value)} options={[
              { value: "member", label: "Member" }, { value: "visitor", label: "Visitor" },
              { value: "invitee", label: "Invitee" }, { value: "convert", label: "Convert" },
            ]} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 rounded accent-forest" />
            <span className="text-sm font-body text-navy">Account Active</span>
          </label>
        </div>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </form>
    </div>
  );
}
