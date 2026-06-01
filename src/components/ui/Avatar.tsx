interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Deterministic color based on name
function getColor(name: string) {
  const colors = [
    "bg-navy text-cream",
    "bg-forest text-cream",
    "bg-burgundy text-cream",
    "bg-gold text-navy-dark",
    "bg-amber text-navy-dark",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} ${getColor(name)} rounded-full flex items-center justify-center font-heading font-semibold flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
