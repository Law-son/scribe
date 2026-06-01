import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable streaming metadata to prevent server/client HTML mismatch during hydration.
  // When streaming is on, the HTML pass and RSC payload pass can get different
  // serveStreamingMetadata values, producing a <div hidden> mismatch in MetadataWrapper.
  htmlLimitedBots: /.*/,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
