import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { SupabaseProvider } from "./components/supabase-provider";
import { NavBar } from "./components/nav-bar";
import { BottomDock } from "./components/bottom-dock";
import { ScrollToTop } from "./components/scroll-to-top";
import { AuthSync } from "./components/auth-sync";
import { Footer } from "./components/footer";
import { AccountStatusGate } from "./components/account-status-gate";
import { LocaleProvider } from "./components/locale-provider";
import { isRtlLocale, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";
import { Toaster } from "sonner";
import "./globals.css";

const notoKufiArabic = localFont({
  variable: "--font-noto-kufi",
  display: "swap",
  src: [
    {
      path: "./fonts/NotoKufiArabic-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/NotoKufiArabic-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/NotoKufiArabic-700.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

const SITE_URL = "https://www.postaty.com";
const metadataBase = (() => {
  try {
    const configuredUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL ??
      SITE_URL;
    return new URL(configuredUrl);
  } catch {
    return new URL(SITE_URL);
  }
})();

const metadataTitle = "مولد منشورات السوشيال ميديا | Postaty";
const metadataDescription =
  "أنشئ منشورات احترافية لعروضك على السوشيال ميديا خلال دقائق";
const ogImageUrl = `${SITE_URL}/opengraph-image.png`;

export const metadata: Metadata = {
  metadataBase,
  alternates: {
    canonical: "/",
  },
  title: metadataTitle,
  description: metadataDescription,
  openGraph: {
    type: "website",
    url: SITE_URL,
    locale: "ar_AR",
    siteName: "Postaty",
    title: metadataTitle,
    description: metadataDescription,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Postaty - AI social media post generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: metadataTitle,
    description: metadataDescription,
    site: "@postatyapp",
    creator: "@postatyapp",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Postaty - AI social media post generator",
      },
    ],
  },
  other: {
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:type": "image/png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        {/* Hardcoded OG meta tags as fallback for WhatsApp/Facebook crawlers */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content={ogImageUrl} />
      </head>
      <body className={`${notoKufiArabic.variable} antialiased`}>
        <LocaleProvider locale={locale}>
          <SupabaseProvider>
            <ScrollToTop />
            <AuthSync />
            <AccountStatusGate>
              <NavBar locale={locale} />
              <main className="pb-20 md:pb-0 min-h-screen">{children}</main>
              <Footer locale={locale} />
              <BottomDock />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: "var(--surface-2)",
                    color: "var(--foreground)",
                    border: "1px solid var(--card-border)",
                  },
                }}
              />
            </AccountStatusGate>
          </SupabaseProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
