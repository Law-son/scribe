import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UCM Scribe",
    template: "%s | UCM Scribe",
  },
  description:
    "A digital platform for spiritual growth, community engagement, and evangelism.",
  openGraph: {
    title: "UCM Scribe",
    description:
      "Sermons, Bible study notes, devotionals, and community engagement for UCM members.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
              background: "#1B2A4A",
              color: "#F5F0E8",
              borderRadius: "0.5rem",
            },
            success: {
              iconTheme: { primary: "#C9A84C", secondary: "#F5F0E8" },
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
