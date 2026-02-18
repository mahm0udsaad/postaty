import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Eye, Globe, Users, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "من نحن | Postaty",
  description: "تعرف على فريق Postaty ورؤيتنا لتمكين أصحاب المشاريع من تصميم إعلانات احترافية بالذكاء الاصطناعي",
};

const values = [
  {
    icon: Zap,
    title: "السرعة",
    description: "نؤمن إن وقت صاحب المشروع أغلى من إنه يضيعه على التصميم. لذلك نوفر تصاميم جاهزة في ثوانٍ.",
  },
  {
    icon: Eye,
    title: "الجودة",
    description: "كل تصميم يطلع من Postaty لازم يكون بمستوى احترافي يليق بعلامتك التجارية.",
  },
  {
    icon: Globe,
    title: "عربي أولاً",
    description: "بنينا المنصة من الصفر للسوق العربي — خطوط عربية، تصميم RTL، ومحتوى يفهم جمهورك.",
  },
  {
    icon: Target,
    title: "البساطة",
    description: "لا تحتاج خبرة تصميم. ارفع صورتك، واحنا نتكفل بالباقي.",
  },
];

const stats = [
  { value: "+2,000", label: "تصميم تم إنشاؤه" },
  { value: "+500", label: "صاحب مشروع" },
  { value: "30 ثانية", label: "متوسط وقت التصميم" },
  { value: "6", label: "أحجام جاهزة لكل منصة" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles size={16} />
            من نحن
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            نصمم المستقبل
            <br />
            <span className="text-gradient">لأصحاب المشاريع العرب</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Postaty منصة ذكاء اصطناعي سعودية تمكّن أصحاب المطاعم والمتاجر والمشاريع الصغيرة من تصميم إعلانات احترافية بدون الحاجة لمصمم أو خبرة تقنية.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-card-border bg-surface-1">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-2">{stat.value}</div>
              <div className="text-muted text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">قصتنا</h2>
          <div className="space-y-6 text-muted text-lg leading-relaxed">
            <p>
              بدأت فكرة Postaty من مشكلة حقيقية — أصحاب المشاريع الصغيرة والمتوسطة في العالم العربي يحتاجون إعلانات سوشيال ميديا بشكل يومي، لكن توظيف مصمم محترف مكلف، والأدوات المتاحة مصممة للسوق الغربي ولا تدعم العربية بشكل جيد.
            </p>
            <p>
              قررنا نبني أداة تفهم السوق العربي — من الخطوط والألوان إلى أسلوب الكتابة والتسويق. باستخدام أحدث تقنيات الذكاء الاصطناعي، نحول صورة منتج بسيطة إلى تصميم إعلاني احترافي في أقل من 30 ثانية.
            </p>
            <p>
              رؤيتنا إن كل صاحب مشروع في العالم العربي يقدر ينافس الشركات الكبيرة بتصاميم احترافية، بدون ما يحتاج ميزانية تسويق ضخمة.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-surface-1 border-y border-card-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">قيمنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value) => (
              <div key={value.title} className="bg-background border border-card-border rounded-2xl p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-6">جاهز تجرب بنفسك؟</h2>
          <p className="text-muted text-lg mb-8">ابدأ مجاناً وشوف كيف Postaty يغير طريقة تسويقك.</p>
          <Link
            href="/create"
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            ابدأ مجاناً
          </Link>
        </div>
      </section>
    </div>
  );
}
