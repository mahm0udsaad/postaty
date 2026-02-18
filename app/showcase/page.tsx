import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "أعمالنا | Postaty",
  description: "شاهد نماذج من التصاميم الاحترافية التي أنشأها مستخدمو Postaty بالذكاء الاصطناعي",
};

const categories = [
  { id: "restaurants", name: "مطاعم وكافيهات", color: "from-orange-500 to-amber-500" },
  { id: "supermarkets", name: "سوبر ماركت", color: "from-emerald-500 to-green-500" },
  { id: "ecommerce", name: "متاجر إلكترونية", color: "from-violet-500 to-purple-500" },
  { id: "services", name: "خدمات", color: "from-blue-500 to-cyan-500" },
  { id: "fashion", name: "أزياء وموضة", color: "from-pink-500 to-rose-500" },
  { id: "beauty", name: "تجميل وعناية", color: "from-fuchsia-500 to-pink-500" },
];

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

      {/* Categories */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="px-5 py-2.5 rounded-full border border-card-border text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Placeholder grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="aspect-square rounded-2xl border border-card-border bg-surface-1 flex flex-col items-center justify-center gap-4 p-8"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} opacity-20`} />
                <span className="text-muted text-sm font-semibold">{cat.name}</span>
                <span className="text-muted/50 text-xs">قريباً...</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
