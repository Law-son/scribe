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
    "Grow in faith. Engage with God's Word. Sermons, devotionals, Bible study notes, and community for UCM members.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "UCM Scribe — Digital Faith Platform",
    description:
      "Grow in faith. Engage with God's Word. Sermons, devotionals, Bible study notes, and community for UCM members.",
    type: "website",
    images: [
      {
        url: "/apple-touch-icon.png",
        width: 180,
        height: 180,
        alt: "UCM Scribe",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "UCM Scribe — Digital Faith Platform",
    description:
      "Grow in faith. Engage with God's Word. Sermons, devotionals, Bible study notes, and community for UCM members.",
    images: ["/apple-touch-icon.png"],
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
