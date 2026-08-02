"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }

      // Admins manage their own contact details via /profile and aren't
      // forced through the member-onboarding completion flow.
      if (data.user.role !== "admin" && !data.user.profileComplete) {
        toast.success(`Welcome back, ${data.user.name}! Please complete your profile.`);
        router.push("/complete-profile");
      } else {
        toast.success(`Welcome back, ${data.user.name}!`);
        router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-3xl text-navy font-bold">UCM Scribe</h1>
          </Link>
          <p className="text-navy/60 font-body mt-2">Sign in to continue your journey</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-8">
          <h2 className="font-heading text-xl text-navy font-semibold mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="0244000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-right">
            <Link href="/forgot-password" className="text-xs text-navy/50 font-body hover:text-gold-dark transition-colors">
              Forgot password?
            </Link>
          </div>

          <div className="mt-4 text-center border-t border-cream-dark pt-4">
            <p className="text-sm text-navy/60 font-body">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-gold-dark font-medium hover:underline">
                Join UCM Scribe
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
