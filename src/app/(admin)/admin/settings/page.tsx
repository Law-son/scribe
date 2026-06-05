"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { format } from "date-fns";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CORE_PLATFORMS = [
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/..." },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
];

const currentYear = new Date().getFullYear();

interface ThemeHistoryEntry {
  type: string;
  label: string;
  theme: string;
  scripture?: string;
  archivedAt: string;
}

interface CustomSocialLink {
  platform: string;
  label: string;
  url: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [customSocialLinks, setCustomSocialLinks] = useState<CustomSocialLink[]>([]);
  const [annualTheme, setAnnualTheme] = useState({ year: currentYear, theme: "", scripture: "" });
  const [monthlyThemes, setMonthlyThemes] = useState<{ month: number; year: number; theme: string }[]>(
    MONTHS.map((_, i) => ({ month: i + 1, year: currentYear, theme: "" }))
  );
  const [semesterTheme, setSemesterTheme] = useState({ theme: "", year: currentYear });
  const [themeHistory, setThemeHistory] = useState<ThemeHistoryEntry[]>([]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        if (data.customSocialLinks) setCustomSocialLinks(data.customSocialLinks);
        if (data.annualTheme) setAnnualTheme({ year: data.annualTheme.year ?? currentYear, theme: data.annualTheme.theme ?? "", scripture: data.annualTheme.scripture ?? "" });
        if (data.monthlyThemes?.length) {
          setMonthlyThemes(
            MONTHS.map((_, i) => {
              const found = data.monthlyThemes.find((m: { month: number }) => m.month === i + 1);
              return found ?? { month: i + 1, year: currentYear, theme: "" };
            })
          );
        }
        if (data.semesterTheme?.theme) setSemesterTheme({ theme: data.semesterTheme.theme ?? "", year: data.semesterTheme.year ?? currentYear });
        if (data.themeHistory) setThemeHistory(data.themeHistory);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks, customSocialLinks, annualTheme, monthlyThemes, semesterTheme }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Failed to save");
        return;
      }
      toast.success("Settings saved!");
      fetch("/api/admin/settings").then((r) => r.json()).then((data) => {
        if (data.themeHistory) setThemeHistory(data.themeHistory);
      });
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  }

  function addCustomLink() {
    setCustomSocialLinks((prev) => [...prev, { platform: "", label: "", url: "" }]);
  }

  function updateCustomLink(i: number, field: keyof CustomSocialLink, value: string) {
    setCustomSocialLinks((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      // Auto-fill platform from label
      if (field === "label" && !updated[i].platform) {
        updated[i].platform = value.toLowerCase().replace(/\s+/g, "");
      }
      return updated;
    });
  }

  function removeCustomLink(i: number) {
    setCustomSocialLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (fetching) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-navy/40 font-body text-sm">Loading settings…</p>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Settings</h1>
        <p className="text-navy/60 font-body mt-1">Manage social links, annual, monthly, and semester themes.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Social Media Links */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-bold mb-1">Social Media Links</h2>
          <p className="text-xs text-navy/50 font-body mb-4">These appear on the home page and all content pages.</p>

          {/* Core 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {CORE_PLATFORMS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                placeholder={placeholder}
                type="url"
                value={socialLinks[key] ?? ""}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            ))}
          </div>

          {/* Custom platforms */}
          {customSocialLinks.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-xs font-body font-semibold text-navy/50 uppercase tracking-wider">Custom Platforms</p>
              {customSocialLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      label="Platform name"
                      placeholder="e.g. YouTube"
                      value={link.label}
                      onChange={(e) => updateCustomLink(i, "label", e.target.value)}
                    />
                    <Input
                      label="Identifier"
                      placeholder="e.g. youtube"
                      value={link.platform}
                      onChange={(e) => updateCustomLink(i, "platform", e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    />
                    <Input
                      label="URL"
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateCustomLink(i, "url", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomLink(i)}
                    className="mt-6 p-2 text-navy/40 hover:text-red-500 transition-colors"
                    aria-label="Remove"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addCustomLink}
            className="flex items-center gap-2 text-sm font-body text-navy/60 hover:text-navy border border-dashed border-cream-dark rounded-lg px-4 py-2.5 transition-colors w-full justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Custom Platform
          </button>
        </section>

        {/* Annual Theme */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-bold mb-4">Annual Theme</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Year"
              type="number"
              min="2000"
              max="2100"
              value={annualTheme.year}
              onChange={(e) => setAnnualTheme((t) => ({ ...t, year: parseInt(e.target.value) || currentYear }))}
            />
            <div className="col-span-2">
              <Input
                label="Theme"
                placeholder="e.g. Year of Divine Acceleration"
                value={annualTheme.theme}
                onChange={(e) => setAnnualTheme((t) => ({ ...t, theme: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <Input
              label="Key Scripture (optional)"
              placeholder="e.g. Isaiah 43:19"
              value={annualTheme.scripture}
              onChange={(e) => setAnnualTheme((t) => ({ ...t, scripture: e.target.value }))}
            />
          </div>
        </section>

        {/* Semester Theme */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-bold mb-1">Semester Theme</h2>
          <p className="text-xs text-navy/50 font-body mb-4">
            Set the current semester theme. Changing it will automatically archive the previous one with the date.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Year"
              type="number"
              min="2000"
              max="2100"
              value={semesterTheme.year}
              onChange={(e) => setSemesterTheme((t) => ({ ...t, year: parseInt(e.target.value) || currentYear }))}
            />
            <div className="col-span-2">
              <Input
                label="Theme"
                placeholder="e.g. Season of New Beginnings"
                value={semesterTheme.theme}
                onChange={(e) => setSemesterTheme((t) => ({ ...t, theme: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Monthly Themes */}
        <section className="bg-white border border-cream-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg text-navy font-bold">Monthly Themes</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs font-body text-navy/60">Year:</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={monthlyThemes[0]?.year ?? currentYear}
                onChange={(e) => {
                  const y = parseInt(e.target.value) || currentYear;
                  setMonthlyThemes((prev) => prev.map((m) => ({ ...m, year: y })));
                }}
                className="w-20 rounded-md border border-cream-dark bg-white px-2 py-1 text-sm font-body text-navy focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyThemes.map((m, i) => (
              <Input
                key={m.month}
                label={MONTHS[i]}
                placeholder="Monthly theme…"
                value={m.theme}
                onChange={(e) => {
                  const updated = [...monthlyThemes];
                  updated[i] = { ...m, theme: e.target.value };
                  setMonthlyThemes(updated);
                }}
              />
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" loading={loading} size="lg">Save Settings</Button>
        </div>
      </form>

      {/* Theme History */}
      {themeHistory.length > 0 && (
        <section className="mt-10 bg-white border border-cream-dark rounded-xl p-6">
          <h2 className="font-heading text-lg text-navy font-bold mb-4">Theme History</h2>
          <div className="space-y-2">
            {[...themeHistory].reverse().map((entry, i) => (
              <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-cream-dark last:border-0">
                <div>
                  <p className="text-sm font-body font-medium text-navy">{entry.label}</p>
                  <p className="text-sm font-body text-navy/70 mt-0.5 italic">&ldquo;{entry.theme}&rdquo;</p>
                  {entry.scripture && (
                    <p className="text-xs font-body text-gold-dark mt-0.5">{entry.scripture}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block text-[10px] font-body font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    entry.type === "annual" ? "bg-gold/20 text-gold-dark" :
                    entry.type === "semester" ? "bg-navy/10 text-navy" :
                    "bg-cream-dark text-navy/60"
                  }`}>
                    {entry.type}
                  </span>
                  <p className="text-xs text-navy/40 font-body mt-1">
                    {format(new Date(entry.archivedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
