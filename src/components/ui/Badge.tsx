type Variant = "gold" | "navy" | "burgundy" | "green" | "gray";

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variants: Record<Variant, string> = {
  gold: "bg-gold/15 text-gold-dark border border-gold/30",
  navy: "bg-navy/10 text-navy border border-navy/20",
  burgundy: "bg-burgundy/10 text-burgundy border border-burgundy/20",
  green: "bg-forest/10 text-forest border border-forest/20",
  gray: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function Badge({ children, variant = "navy", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-body ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
