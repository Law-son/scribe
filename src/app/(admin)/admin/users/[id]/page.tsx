"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import Link from "next/link";
import { GENDER_OPTIONS, MEMBERSHIP_OPTIONS, LEVEL_OPTIONS, DEPARTMENT_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/userOptions";

const emptyForm = {
  name: "", role: "member", isActive: true, gender: "", phone: "", whatsapp: "", email: "",
  dateOfBirth: "", location: "", membershipType: "member", programmeOfStudy: "", level: "",
  departmentInChurch: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
};

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load user");
        const data = await r.json();
        setForm({
          name: data.name ?? "",
          role: data.role ?? "member",
          isActive: data.isActive ?? true,
          gender: data.gender ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          email: data.email ?? "",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().slice(0, 10) : "",
          location: data.location ?? "",
          membershipType: data.membershipType ?? "member",
          programmeOfStudy: data.programmeOfStudy ?? "",
          level: data.level ?? "",
          departmentInChurch: data.departmentInChurch ?? "",
          emergencyContactName: data.emergencyContactName ?? "",
          emergencyContactPhone: data.emergencyContactPhone ?? "",
          emergencyContactRelationship: data.emergencyContactRelationship ?? "",
        });
      })
      .catch(() => toast.error("Failed to load user details"))
      .finally(() => setFetching(false));
  }, [id]);

  function set(k: string, v: string | boolean) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => typeof value !== "string" || value.trim() !== "")
    );
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success("User updated!"); router.push("/admin/users"); }
    else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Failed to update");
    }
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
          <h2 className="font-heading text-base text-navy font-semibold">Personal Details</h2>
          <Input label="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} options={GENDER_OPTIONS} />
            <Input label="Phone Number" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <Input label="WhatsApp Number" type="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          <Input label="Email Address" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>

        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-base text-navy font-semibold">Academic & Church Info</h2>
          <Input label="Programme of Study" value={form.programmeOfStudy} onChange={(e) => set("programmeOfStudy", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Level / Year" value={form.level} onChange={(e) => set("level", e.target.value)} options={LEVEL_OPTIONS} />
            <Select label="Membership Type" value={form.membershipType} onChange={(e) => set("membershipType", e.target.value)} options={MEMBERSHIP_OPTIONS} />
          </div>
          <Input label="Location/Name of Hostel" value={form.location} onChange={(e) => set("location", e.target.value)} />
          <Select label="Department in the Church" value={form.departmentInChurch} onChange={(e) => set("departmentInChurch", e.target.value)} options={DEPARTMENT_OPTIONS} />
        </div>

        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-base text-navy font-semibold">Emergency Contact</h2>
          <Input label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
          <Input label="Emergency Contact Number" type="tel" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
          <Select label="Relationship to Emergency Contact" value={form.emergencyContactRelationship} onChange={(e) => set("emergencyContactRelationship", e.target.value)} options={RELATIONSHIP_OPTIONS} />
        </div>

        <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-base text-navy font-semibold">Account</h2>
          <Select label="Role" value={form.role} onChange={(e) => set("role", e.target.value)} options={[{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }]} />
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
