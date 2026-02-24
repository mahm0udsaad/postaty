import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "puppeteer-core", "@sparticuz/chromium"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      ...(isDev
        ? [
            { protocol: "http" as const, hostname: "127.0.0.1", port: "3210" },
            { protocol: "http" as const, hostname: "localhost", port: "3210" },
          ]
        : []),
    ],
  },
  async headers() {
    const devImgSrc = isDev ? " http://127.0.0.1:* http://localhost:*" : "";
    const devConnectSrc = isDev
      ? " http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:*"
      : "";

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: https://*.convex.cloud https://*.convex.site https://*.supabase.co https://lh3.googleusercontent.com https://img.clerk.com https://*.clerk.accounts.dev https://*.clerk.com${devImgSrc}`,
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' data: https://*.convex.cloud wss://*.convex.cloud https://*.convex.site wss://*.convex.site https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com https://fonts.googleapis.com https://fonts.gstatic.com https://api.stripe.com https://challenges.cloudflare.com${devConnectSrc}`,
      "media-src 'self' blob: https://*.supabase.co",
      "worker-src 'self' blob:",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
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
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
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
