import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ShowcaseGalleryClient } from "./showcase-gallery-client";

export const metadata: Metadata = {
  title: "أعمالنا | Postaty",
  description: "شاهد نماذج من التصاميم الاحترافية التي أنشأها مستخدمو Postaty بالذكاء الاصطناعي",
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles size={16} />
            أعمالنا
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            تصاميم حقيقية
            <br />
            <span className="text-gradient">من مستخدمين حقيقيين</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            كل هذه التصاميم تم إنشاؤها بواسطة Postaty في ثوانٍ معدودة. تخيّل شكل إعلانك القادم.
          </p>
        </div>
      </section>

      <ShowcaseGalleryClient />

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-6">تبي تصميمك يكون هنا؟</h2>
          <p className="text-muted text-lg mb-8">ابدأ الآن وصمم أول بوستر لك مجاناً.</p>
          <Link
            href="/create"
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            صمم بوسترك الآن
          </Link>
        </div>
      </section>
    </div>
  );
}
