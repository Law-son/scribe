"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";

interface Profile {
  id: string;
  name: string;
  phone: string;
  gender: string;
  membershipType: string;
  location: string;
  role: string;
  totalPoints: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", gender: "", membershipType: "", location: "" });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name,
          phone: data.phone,
          gender: data.gender,
          membershipType: data.membershipType,
          location: data.location,
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
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-6">
        <h2 className="font-heading text-lg text-navy font-semibold mb-6">Edit Details</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />
            <Select
              label="Membership Type"
              value={form.membershipType}
              onChange={(e) => set("membershipType", e.target.value)}
              options={[
                { value: "member", label: "Member" },
                { value: "visitor", label: "Visitor" },
                { value: "invitee", label: "Invitee" },
                { value: "convert", label: "New Convert" },
              ]}
            />
          </div>

          <Input
            label="Location / City"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            required
          />

          <div className="pt-2">
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
