"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

const STEPS = [
  { title: "Your Phone Number", description: "We'll send a verification code by SMS" },
  { title: "Enter Verification Code", description: "Enter the 6-digit code we sent you" },
  { title: "Choose a Password", description: "Set a password for your account" },
];

export default function SetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      toast.success("Verification code sent!");
      setStep(1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      toast.success("A new code has been sent.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid code"); return; }
      setResetToken(data.resetToken);
      setStep(2);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setDone(true);
      toast.success("Password set! Please sign in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><h1 className="font-heading text-3xl text-navy font-bold">UCM Scribe</h1></Link>
          <p className="text-navy/60 font-body mt-2">Set your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-forest" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="font-heading text-xl text-navy font-semibold mb-2">Password set!</h2>
              <p className="text-sm text-navy/60 font-body">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
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
              </div>

              {step === 0 && (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="0244000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Send Code
                  </Button>
                </form>
              )}

              {step === 1 && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <Input
                    label="Verification Code"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  {error && (
                    <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Verify Code
                  </Button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="w-full text-sm text-navy/60 font-body hover:text-navy text-center"
                  >
                    Resend code
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Set Password
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-navy/60 font-body hover:text-navy">
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
