import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <Image
      src="/apple-touch-icon.png"
      alt="UCM Scribe"
      width={size}
      height={size}
      className={`rounded-lg object-contain ${className}`}
      priority
    />
  );
}
