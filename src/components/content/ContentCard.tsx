import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import type { ReactNode } from "react";

const ACCENTS = {
  forest: "border-l-forest",
  gold: "border-l-gold",
  navy: "border-l-navy",
  burgundy: "border-l-burgundy",
} as const;

interface ContentCardProps {
  href: string;
  title: string;
  description?: string;
  meta?: string;
  accent?: keyof typeof ACCENTS;
  badges?: ReactNode;
  leading?: ReactNode;
  topRight?: ReactNode;
  viewsCount?: number;
  likesCount?: number;
}

export function ContentCard({
  href,
  title,
  description,
  meta,
  accent,
  badges,
  leading,
  topRight,
  viewsCount,
  likesCount,
}: ContentCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <div
        className={`h-full bg-white border border-cream-dark rounded-2xl p-5 sm:p-6 transition-all hover:border-navy/20 hover:shadow-md hover:-translate-y-0.5 flex ${
          leading ? "gap-4 items-start" : "flex-col"
        } ${accent ? `border-l-4 ${ACCENTS[accent]}` : ""}`}
      >
        {leading}
        <div className="flex-1 min-w-0 flex flex-col">
          {topRight && <div className="mb-1">{topRight}</div>}
          {badges && <div className="flex flex-wrap gap-2 mb-2">{badges}</div>}
          <h2 className="font-heading text-lg font-semibold text-navy leading-snug mb-1 group-hover:text-navy-light transition-colors line-clamp-2">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-navy/60 font-body line-clamp-2">{description}</p>
          )}
          {meta && <p className="text-xs text-navy/40 font-body mt-1.5">{meta}</p>}

          {(viewsCount !== undefined || likesCount !== undefined) && (
            <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-navy/40 font-body">
              {viewsCount !== undefined && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={13} strokeWidth={1.75} /> {viewsCount}
                </span>
              )}
              {likesCount !== undefined && (
                <span className="inline-flex items-center gap-1.5">
                  <Heart size={13} strokeWidth={1.75} /> {likesCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
