"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { GENDER_OPTIONS, MEMBERSHIP_OPTIONS, LEVEL_OPTIONS, DEPARTMENT_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/userOptions";
import { isProfileComplete } from "@/lib/profileCompletion";

interface UserSuggestion { id: string; name: string; }

const emptyForm = {
  name: "", dateOfBirth: "", gender: "male", phone: "", whatsapp: "", email: "",
  programmeOfStudy: "", level: "year_1", location: "", membershipType: "member", departmentInChurch: "choir",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "mother",
};

type FormState = typeof emptyForm;

const STEPS: { title: string; description: string; fields: (keyof FormState)[] }[] = [
  {
    title: "Personal Details",
    description: "A few details we didn't collect before",
    fields: ["name", "dateOfBirth", "gender", "phone", "whatsapp", "email"],
  },
  {
    title: "Academic & Church Info",
    description: "Your studies and role in the church",
    fields: ["programmeOfStudy", "level", "location", "membershipType", "departmentInChurch"],
  },
  {
    title: "Emergency Contact",
    description: "Who should we reach in an emergency?",
    fields: ["emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship"],
  },
];

// Mirrors the server-side Zod minimums in /api/auth/me — checked client-side
// too so a too-short value never makes it to a 400 with no way back out.
const MIN_LENGTHS: Partial<Record<keyof FormState, number>> = {
  name: 2,
  phone: 7,
  whatsapp: 7,
  programmeOfStudy: 2,
  location: 2,
  emergencyContactName: 2,
  emergencyContactPhone: 7,
};

const FIELD_LABELS: Partial<Record<keyof FormState, string>> = {
  name: "Full Name",
  phone: "Phone Number",
  whatsapp: "WhatsApp Number",
  programmeOfStudy: "Programme of Study",
  location: "Location/Name of Hostel",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactPhone: "Emergency Contact Number",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("member");
  const [form, setForm] = useState<FormState>(emptyForm);

  const [referralSearch, setReferralSearch] = useState("");
  const [referralResults, setReferralResults] = useState<UserSuggestion[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<UserSuggestion | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) { router.push("/login"); return; }
        const data = await r.json();
        if (isProfileComplete(data)) {
          router.push(data.role === "admin" ? "/admin" : "/dashboard");
          return;
        }
        setRole(data.role ?? "member");
        setForm({
          name: data.name ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          gender: data.gender || "male",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          email: data.email ?? "",
          programmeOfStudy: data.programmeOfStudy ?? "",
          level: data.level || "year_1",
          location: data.location ?? "",
          membershipType: data.membershipType || "member",
          departmentInChurch: data.departmentInChurch || "choir",
          emergencyContactName: data.emergencyContactName ?? "",
          emergencyContactPhone: data.emergencyContactPhone ?? "",
          emergencyContactRelationship: data.emergencyContactRelationship || "mother",
        });
        if (data.referredBy) setSelectedReferrer(data.referredBy);
      })
      .catch(() => setError("Couldn't load your profile. Please refresh and try again."))
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchReferrals = useCallback(async (q: string) => {
    if (q.length < 2) { setReferralResults([]); setReferralLoading(false); return; }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setReferralResults(data.users ?? []);
    } finally {
      setReferralLoading(false);
    }
  }, []);

  useDebounce(referralSearch, 400, searchReferrals);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(idx: number): string | null {
    for (const field of STEPS[idx].fields) {
      const value = form[field].trim();
      if (!value) return "Please fill in all required fields before continuing";
      const min = MIN_LENGTHS[field];
      if (min && value.length < min) {
        return `${FIELD_LABELS[field] ?? field} must be at least ${min} characters`;
      }
    }
    if (idx === 0 && !EMAIL_RE.test(form.email)) return "Please enter a valid email address";
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referredBy: selectedReferrer?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        const fieldErrors = data.details?.fieldErrors as Record<string, string[]> | undefined;
        const detail = fieldErrors ? Object.values(fieldErrors).flat().join(" ") : "";
        setError(detail || data.error || "Failed to save your profile");
        return;
      }
      toast.success("Profile complete. Welcome back! 🎉");
      router.push(role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (fetching) return <PageLoader />;

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/"><h1 className="font-heading text-3xl text-navy font-bold">UCM Scribe</h1></Link>
          <p className="text-navy/60 font-body mt-2">
            We&apos;ve added a few new fields since you joined — please complete your profile to continue.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-8">
          {/* Stepper */}
          <div className="flex items-center mb-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-semibold transition-colors ${
                      i < step
                        ? "bg-gold text-navy"
                        : i === step
                        ? "bg-navy text-cream"
                        : "bg-cream-dark text-navy/40"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < step ? "bg-gold" : "bg-cream-dark"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-xl text-navy font-semibold">{STEPS[step].title}</h2>
            <p className="text-sm text-navy/50 font-body mt-1">{STEPS[step].description}</p>
            <p className="text-xs text-navy/40 font-body mt-1">Step {step + 1} of {STEPS.length}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 0 && (
              <>
                <Input label="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required />
                <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} options={GENDER_OPTIONS} />
                <Input label="Phone Number" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
                <Input label="WhatsApp Number" type="tel" placeholder="0244000000" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} required />
                <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </>
            )}

            {step === 1 && (
              <>
                <Input label="Programme of Study" placeholder="e.g. BSc Computer Science" value={form.programmeOfStudy} onChange={(e) => set("programmeOfStudy", e.target.value)} required />
                <Select label="Level / Year" value={form.level} onChange={(e) => set("level", e.target.value)} options={LEVEL_OPTIONS} />
                <Input label="Location/Name of Hostel" value={form.location} onChange={(e) => set("location", e.target.value)} required />
                <Select label="I am a…" value={form.membershipType} onChange={(e) => set("membershipType", e.target.value)} options={MEMBERSHIP_OPTIONS} />
                <Select label="Department in the Church" value={form.departmentInChurch} onChange={(e) => set("departmentInChurch", e.target.value)} options={DEPARTMENT_OPTIONS} />

                {/* Referral search */}
                <div className="relative">
                  <Input
                    label="Who invited you? (optional)"
                    placeholder="Search member name…"
                    value={selectedReferrer ? selectedReferrer.name : referralSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedReferrer(null);
                      setReferralSearch(value);
                      setReferralLoading(value.trim().length >= 2);
                      if (value.trim().length < 2) setReferralResults([]);
                    }}
                  />
                  {referralLoading && !selectedReferrer && (
                    <span className="absolute right-3 top-8 flex items-center gap-1.5 text-xs text-navy/40 font-body">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Searching…
                    </span>
                  )}
                  {!referralLoading && referralResults.length > 0 && !selectedReferrer && (
                    <ul className="absolute z-10 w-full bg-white border border-cream-dark rounded-lg mt-1 shadow-lg overflow-hidden">
                      {referralResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => { setSelectedReferrer(u); setReferralSearch(""); setReferralResults([]); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-body text-navy hover:bg-cream transition-colors"
                          >
                            {u.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!referralLoading && !selectedReferrer && referralSearch.trim().length >= 2 && referralResults.length === 0 && (
                    <p className="absolute w-full bg-white border border-cream-dark rounded-lg mt-1 shadow-lg px-4 py-2.5 text-sm font-body text-navy/40">
                      No members found
                    </p>
                  )}
                  {selectedReferrer && (
                    <button type="button" onClick={() => setSelectedReferrer(null)} className="absolute right-3 top-8 text-xs text-burgundy hover:underline">
                      Clear
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Input label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} required />
                <Input label="Emergency Contact Number" type="tel" placeholder="0244000000" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} required />
                <Select
                  label="Relationship to Emergency Contact"
                  value={form.emergencyContactRelationship}
                  onChange={(e) => set("emergencyContactRelationship", e.target.value)}
                  options={RELATIONSHIP_OPTIONS}
                />
              </>
            )}

            {error && (
              <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="secondary" className="flex-1" size="lg" onClick={goBack} disabled={saving}>
                  Back
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" className="flex-1" size="lg" loading={saving}>
                  Complete Profile
                </Button>
              ) : (
                <Button type="button" className="flex-1" size="lg" onClick={goNext}>
                  Continue
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-navy/60 font-body">
              Not you?{" "}
              <button type="button" onClick={handleLogout} className="text-gold-dark font-medium hover:underline">
                Sign out
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
