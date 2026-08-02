"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { GENDER_OPTIONS, MEMBERSHIP_OPTIONS, LEVEL_OPTIONS, DEPARTMENT_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/userOptions";

interface Profile {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  membershipType: string;
  programmeOfStudy: string;
  level: string;
  location: string;
  departmentInChurch: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  role: string;
  totalPoints: number;
}

const emptyForm = {
  name: "", phone: "", whatsapp: "", email: "", dateOfBirth: "", gender: "",
  membershipType: "", programmeOfStudy: "", level: "", location: "", departmentInChurch: "",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isStudent, setIsStudent] = useState(true);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setIsStudent(data.isStudent ?? true);
        setForm({
          name: data.name,
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          membershipType: data.membershipType,
          programmeOfStudy: data.programmeOfStudy,
          level: data.level,
          location: data.location,
          departmentInChurch: data.departmentInChurch,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          emergencyContactRelationship: data.emergencyContactRelationship,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== "")),
        isStudent,
      };
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save changes");
        return;
      }
      setProfile((p) => p ? { ...p, ...data } : p);
      toast.success("Profile updated");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cream-dark rounded w-48" />
          <div className="h-48 bg-cream-dark rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">My Profile</h1>
        <p className="text-navy/60 font-body mt-1">View and update your account details.</p>
      </div>

      {/* Identity card */}
      <div className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-6 mb-8 text-cream flex items-center gap-5">
        <Avatar name={profile.name} size="lg" />
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold text-cream truncate">{profile.name}</p>
          <p className="text-cream/60 text-sm font-body mt-0.5">{profile.phone}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="gold">{profile.totalPoints.toLocaleString()} pts</Badge>
            {profile.role === "admin" && <Badge variant="navy">Admin</Badge>}
            <span className="text-xs text-cream/50 font-body capitalize">{profile.membershipType}</span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-6">Personal Details</h2>
          <div className="space-y-4">
            <Input label="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} options={GENDER_OPTIONS} />
              <Input label="Phone Number" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            </div>
            <Input label="WhatsApp Number" type="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            <Input label="Email Address" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-6">Academic & Church Info</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!isStudent}
                onChange={(e) => setIsStudent(!e.target.checked)}
                className="w-4 h-4 rounded accent-forest"
              />
              <span className="text-sm font-body text-navy">I&apos;m not a student</span>
            </label>
            {isStudent && (
              <>
                <Input label="Programme of Study" value={form.programmeOfStudy} onChange={(e) => set("programmeOfStudy", e.target.value)} />
                <Select label="Level / Year" value={form.level} onChange={(e) => set("level", e.target.value)} options={LEVEL_OPTIONS} />
              </>
            )}
            <Select label="Membership Type" value={form.membershipType} onChange={(e) => set("membershipType", e.target.value)} options={MEMBERSHIP_OPTIONS} />
            <Input label="Location/Name of Hostel" value={form.location} onChange={(e) => set("location", e.target.value)} required />
            <Select label="Department in the Church" value={form.departmentInChurch} onChange={(e) => set("departmentInChurch", e.target.value)} options={DEPARTMENT_OPTIONS} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-6">
          <h2 className="font-heading text-lg text-navy font-semibold mb-6">Emergency Contact</h2>
          <div className="space-y-4">
            <Input label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
            <Input label="Emergency Contact Number" type="tel" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
            <Select label="Relationship to Emergency Contact" value={form.emergencyContactRelationship} onChange={(e) => set("emergencyContactRelationship", e.target.value)} options={RELATIONSHIP_OPTIONS} />
          </div>
        </div>

        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
