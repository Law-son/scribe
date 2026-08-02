"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { GENDER_OPTIONS, MEMBERSHIP_OPTIONS, LEVEL_OPTIONS, DEPARTMENT_OPTIONS, RELATIONSHIP_OPTIONS } from "@/lib/userOptions";

interface UserSuggestion { id: string; name: string; phone: string; }

const initialForm = {
  name: "",
  dateOfBirth: "",
  gender: "male",
  phone: "",
  whatsapp: "",
  email: "",
  programmeOfStudy: "",
  level: "year_1",
  location: "",
  membershipType: "member",
  departmentInChurch: "choir",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "mother",
  password: "",
  confirmPassword: "",
};

type FormState = typeof initialForm;

const STEPS: { title: string; description: string; fields: (keyof FormState)[] }[] = [
  {
    title: "Personal Details",
    description: "Tell us a bit about yourself",
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
  {
    title: "Account Security",
    description: "Secure your account with a password",
    fields: ["password", "confirmPassword"],
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralSearch, setReferralSearch] = useState("");
  const [referralResults, setReferralResults] = useState<UserSuggestion[]>([]);
  const [selectedReferrer, setSelectedReferrer] = useState<UserSuggestion | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const searchReferrals = useCallback(async (q: string) => {
    if (q.length < 2) { setReferralResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setReferralResults(data.users ?? []);
  }, []);

  useDebounce(referralSearch, 400, searchReferrals);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(idx: number): string | null {
    for (const field of STEPS[idx].fields) {
      if (!form[field].trim()) return "Please fill in all required fields before continuing";
    }
    if (idx === 0 && !EMAIL_RE.test(form.email)) return "Please enter a valid email address";
    if (idx === 3) {
      if (form.password.length < 6) return "Password must be at least 6 characters";
      if (form.password !== form.confirmPassword) return "Passwords do not match";
    }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          programmeOfStudy: form.programmeOfStudy,
          level: form.level,
          location: form.location,
          membershipType: form.membershipType,
          departmentInChurch: form.departmentInChurch,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          emergencyContactRelationship: form.emergencyContactRelationship,
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

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/"><h1 className="font-heading text-3xl text-navy font-bold">UCM Scribe</h1></Link>
          <p className="text-navy/60 font-body mt-2">Create your account and join the community</p>
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
                <Input label="Full Name" placeholder="Your full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required />
                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  options={GENDER_OPTIONS}
                />
                <Input label="Phone Number" type="tel" placeholder="0244000000" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
                <Input label="WhatsApp Number" type="tel" placeholder="0244000000" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} required />
                <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </>
            )}

            {step === 1 && (
              <>
                <Input label="Programme of Study" placeholder="e.g. BSc Computer Science" value={form.programmeOfStudy} onChange={(e) => set("programmeOfStudy", e.target.value)} required />
                <Select label="Level / Year" value={form.level} onChange={(e) => set("level", e.target.value)} options={LEVEL_OPTIONS} />
                <Input label="Location/Name of Hostel" placeholder="Accra, Ghana" value={form.location} onChange={(e) => set("location", e.target.value)} required />
                <Select
                  label="I am a…"
                  value={form.membershipType}
                  onChange={(e) => set("membershipType", e.target.value)}
                  options={MEMBERSHIP_OPTIONS}
                />
                <Select
                  label="Department in the Church"
                  value={form.departmentInChurch}
                  onChange={(e) => set("departmentInChurch", e.target.value)}
                  options={DEPARTMENT_OPTIONS}
                />

                {/* Referral search */}
                <div className="relative">
                  <Input
                    label="Who invited you?"
                    placeholder="Search member name… (optional)"
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
              </>
            )}

            {step === 2 && (
              <>
                <Input label="Emergency Contact Name" placeholder="Full name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} required />
                <Input label="Emergency Contact Number" type="tel" placeholder="0244000000" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} required />
                <Select
                  label="Relationship to Emergency Contact"
                  value={form.emergencyContactRelationship}
                  onChange={(e) => set("emergencyContactRelationship", e.target.value)}
                  options={RELATIONSHIP_OPTIONS}
                />
              </>
            )}

            {step === 3 && (
              <>
                <Input label="Password" type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => set("password", e.target.value)} required />
                <Input label="Confirm Password" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} required />
              </>
            )}

            {error && (
              <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="secondary" className="flex-1" size="lg" onClick={goBack} disabled={loading}>
                  Back
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" className="flex-1" size="lg" loading={loading}>
                  Join UCM Scribe
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
              Already have an account?{" "}
              <Link href="/login" className="text-gold-dark font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
