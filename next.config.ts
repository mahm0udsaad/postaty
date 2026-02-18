import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "puppeteer-core", "@sparticuz/chromium"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      {
        // Convex file storage URLs
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        // Convex file storage URLs (newer convex.site domain)
        protocol: "https",
        hostname: "**.convex.site",
      },
      {
        // Local Convex dev
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3210",
      },
      {
        // Local Convex dev
        protocol: "http",
        hostname: "localhost",
        port: "3210",
      },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.convex.cloud https://*.convex.site https://img.clerk.com https://*.clerk.accounts.dev https://*.clerk.com http://127.0.0.1:* http://localhost:*",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' data: https://*.convex.cloud wss://*.convex.cloud https://*.convex.site wss://*.convex.site https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com https://api.stripe.com",
      "worker-src 'self' blob:",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
