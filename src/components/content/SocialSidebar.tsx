import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { SocialLinksDisplay, type SocialLinkItem } from "./SocialLinksDisplay";

async function getSettings() {
  try {
    await connectDB();
    return await SiteSettings.findOne({ key: "main" }).lean();
  } catch {
    return null;
  }
}

export async function SocialSidebar() {
  const settings = await getSettings();

  const coreLinks: SocialLinkItem[] = [
    { platform: "tiktok", label: "TikTok", url: settings?.socialLinks?.tiktok ?? "" },
    { platform: "whatsapp", label: "WhatsApp", url: settings?.socialLinks?.whatsapp ?? "" },
    { platform: "facebook", label: "Facebook", url: settings?.socialLinks?.facebook ?? "" },
    { platform: "instagram", label: "Instagram", url: settings?.socialLinks?.instagram ?? "" },
  ].filter((l) => l.url);

  const customLinks: SocialLinkItem[] = (settings?.customSocialLinks ?? [])
    .filter((l) => l.url)
    .map((l) => ({ platform: l.platform, label: l.label, url: l.url }));

  const allLinks = [...coreLinks, ...customLinks];

  const annualTheme = settings?.annualTheme;
  const semesterTheme = settings?.semesterTheme;

  const hasThemes = (annualTheme?.theme || semesterTheme?.theme);
  const hasLinks = allLinks.length > 0;

  if (!hasLinks && !hasThemes) return null;

  return (
    <div className="my-10 py-8 border-t border-b border-cream-dark space-y-6">
      {/* Themes */}
      {hasThemes && (
        <div className="flex flex-wrap gap-3">
          {annualTheme?.theme && (
            <div className="flex-1 min-w-[200px] bg-navy/5 border border-navy/10 rounded-xl px-5 py-4">
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-navy/40 mb-1">
                Annual Theme {annualTheme.year}
              </p>
              <p className="font-heading text-navy font-semibold leading-snug">
                {annualTheme.theme}
              </p>
              {annualTheme.scripture && (
                <p className="text-xs text-gold-dark font-body mt-1">{annualTheme.scripture}</p>
              )}
            </div>
          )}
          {semesterTheme?.theme && (
            <div className="flex-1 min-w-[200px] bg-gold/8 border border-gold/20 rounded-xl px-5 py-4">
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gold-dark/70 mb-1">
                Semester Theme{semesterTheme.year ? ` ${semesterTheme.year}` : ""}
              </p>
              <p className="font-heading text-navy font-semibold leading-snug">
                {semesterTheme.theme}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Social links */}
      {hasLinks && (
        <div>
          <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-navy/40 mb-3">
            Connect with Us
          </p>
          <SocialLinksDisplay links={allLinks} variant="light" showLabel />
        </div>
      )}
    </div>
  );
}
