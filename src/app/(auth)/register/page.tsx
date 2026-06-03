"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";

interface UserSuggestion { id: string; name: string; phone: string; }

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralSearch, setReferralSearch] = useState("");
  const [referralResults, setReferralResults] = useState<UserSuggestion[]>([]);
  const [selectedReferrer, setSelectedReferrer] = useState<UserSuggestion | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", gender: "male", membershipType: "member", location: "", password: "", confirmPassword: "",
  });

  const searchReferrals = useCallback(async (q: string) => {
    if (q.length < 2) { setReferralResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setReferralResults(data.users ?? []);
  }, []);

  useDebounce(referralSearch, 400, searchReferrals);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          membershipType: form.membershipType,
          location: form.location,
          password: form.password,
          referredBy: selectedReferrer?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      toast.success("Welcome to UCM Scribe! 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/"><h1 className="font-heading text-3xl text-navy font-bold">UCM Scribe</h1></Link>
          <p className="text-navy/60 font-body mt-2">Create your account and join the community</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-8">
          <h2 className="font-heading text-xl text-navy font-semibold mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="Your full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <Input label="Phone Number" type="tel" placeholder="0244000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
              />
              <Select
                label="I am a…"
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

            <Input label="Location / City" placeholder="Accra, Ghana" value={form.location} onChange={(e) => set("location", e.target.value)} required />

            {/* Referral search */}
            <div className="relative">
              <Input
                label="Referred By (optional)"
                placeholder="Search member name…"
                value={selectedReferrer ? selectedReferrer.name : referralSearch}
                onChange={(e) => {
                  setSelectedReferrer(null);
                  setReferralSearch(e.target.value);
                }}
              />
              {referralResults.length > 0 && !selectedReferrer && (
                <ul className="absolute z-10 w-full bg-white border border-cream-dark rounded-lg mt-1 shadow-lg overflow-hidden">
                  {referralResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedReferrer(u); setReferralSearch(""); setReferralResults([]); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-body text-navy hover:bg-cream transition-colors"
                      >
                        {u.name}
                        <span className="text-xs text-gray-400 ml-2">{u.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedReferrer && (
                <button type="button" onClick={() => setSelectedReferrer(null)} className="absolute right-3 top-8 text-xs text-burgundy hover:underline">
                  Clear
                </button>
              )}
            </div>

            <Input label="Password" type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            <Input label="Confirm Password" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} required />

            {error && (
              <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Join UCM Scribe
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-navy/60 font-body">
              Already have an account?{" "}
              <Link href="/login" className="text-gold-dark font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
