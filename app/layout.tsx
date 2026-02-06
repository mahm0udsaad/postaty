import type { Metadata } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import { ConvexClientProvider } from "./components/convex-provider";
import { NavBar } from "./components/nav-bar";
import "./globals.css";

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoKufiArabic.variable} antialiased`}>
        <ConvexClientProvider>
          <NavBar />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
