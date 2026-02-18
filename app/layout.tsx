import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./components/convex-provider";
import { NavBar } from "./components/nav-bar";
import { BottomDock } from "./components/bottom-dock";
import { ScrollToTop } from "./components/scroll-to-top";
import { AuthSync } from "./components/auth-sync";
import { Footer } from "./components/footer";
import { AccountStatusGate } from "./components/account-status-gate";
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

const FALLBACK_SITE_URL = "https://www.postaty.com";
const metadataBase = (() => {
  try {
    const configuredUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL ??
      FALLBACK_SITE_URL;
    return new URL(configuredUrl);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
})();

const metadataTitle = "مولد منشورات السوشيال ميديا | Postaty";
const metadataDescription = "أنشئ منشورات احترافية لعروضك على السوشيال ميديا خلال دقائق";

export const metadata: Metadata = {
  metadataBase,
  alternates: {
    canonical: "/",
  },
  title: metadataTitle,
  description: metadataDescription,
  openGraph: {
    type: "website",
    url: "/",
    locale: "ar_AR",
    siteName: "Postaty",
    title: metadataTitle,
    description: metadataDescription,
    images: [
      {
        url: "https://www.postaty.com/opengraph-image.png",
        width: 1200,
        height: 630,
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
    images: ["https://www.postaty.com/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const appShell = (
    <>
      <ScrollToTop />
      <ConvexClientProvider>
        {clerkPublishableKey ? <AuthSync /> : null}
        <AccountStatusGate>
          <NavBar />
          <main className="pb-20 md:pb-0 min-h-screen">
            {children}
          </main>
          <Footer />
          <BottomDock />
        </AccountStatusGate>
      </ConvexClientProvider>
    </>
  );

  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoKufiArabic.variable} antialiased`}>
        {clerkPublishableKey ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>
            {appShell}
          </ClerkProvider>
        ) : (
          appShell
        )}
      </body>
    </html>
  );
}
