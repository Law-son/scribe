"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-3xl text-navy font-bold">UCM Scribe</h1>
          </Link>
          <p className="text-navy/60 font-body mt-2">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-forest" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl text-navy font-semibold mb-2">Check your SMS</h2>
              <p className="text-sm text-navy/60 font-body mb-6">
                If an account with that number exists, we&apos;ve sent a reset link. It expires in 15 minutes.
              </p>
              <Link href="/login" className="text-sm text-gold-dark font-body font-medium hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-xl text-navy font-semibold mb-2">Forgot your password?</h2>
              <p className="text-sm text-navy/60 font-body mb-6">
                Enter your registered phone number and we&apos;ll send you a reset link via SMS.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="0244000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                {error && (
                  <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Send Reset Link
                </Button>
              </form>

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
