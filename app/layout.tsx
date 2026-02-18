import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./components/convex-provider";
import { NavBar } from "./components/nav-bar";
import { BottomDock } from "./components/bottom-dock";
import { ScrollToTop } from "./components/scroll-to-top";
import { AuthSync } from "./components/auth-sync";
import { Footer } from "./components/footer";
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

export const metadata: Metadata = {
  title: "مولد منشورات السوشيال ميديا",
  description: "أنشئ منشورات احترافية لعروضك على السوشيال ميديا",
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
        <NavBar />
        <main className="pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
        <Footer />
        <BottomDock />
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
