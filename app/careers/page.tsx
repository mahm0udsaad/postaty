import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, MapPin, Clock, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "وظائف | Postaty",
  description: "انضم لفريق Postaty وساهم في بناء مستقبل التصميم بالذكاء الاصطناعي في العالم العربي",
};

const openings = [
  {
    title: "مهندس Full-Stack (Next.js)",
    type: "دوام كامل",
    location: "عن بُعد",
    description: "نبحث عن مطور متمكن من Next.js و React وقواعد البيانات لبناء ميزات جديدة وتحسين أداء المنصة.",
    requirements: [
      "خبرة 3+ سنوات في React و Next.js",
      "معرفة بـ TypeScript و Tailwind CSS",
      "خبرة مع قواعد بيانات (PostgreSQL أو ما يماثلها)",
      "اهتمام بتجربة المستخدم وجودة الكود",
    ],
  },
  {
    title: "مهندس ذكاء اصطناعي",
    type: "دوام كامل",
    location: "عن بُعد",
    description: "ساهم في تطوير نماذج الذكاء الاصطناعي لتوليد التصاميم وتحسين جودة المخرجات.",
    requirements: [
      "خبرة في نماذج توليد الصور (Stable Diffusion, DALL-E, etc.)",
      "معرفة بـ Python و PyTorch",
      "فهم لـ Prompt Engineering وتقنيات Fine-tuning",
      "خبرة مع APIs نماذج اللغة الكبيرة",
    ],
  },
  {
    title: "مسوّق رقمي",
    type: "دوام كامل",
    location: "الرياض / عن بُعد",
    description: "قُد استراتيجية التسويق الرقمي لـ Postaty وساعدنا نوصل لأكبر عدد من أصحاب المشاريع.",
    requirements: [
      "خبرة 2+ سنوات في التسويق الرقمي",
      "إدارة حملات على Meta و Google Ads",
      "مهارات كتابة محتوى عربي قوية",
      "تحليل بيانات وفهم مقاييس الأداء",
    ],
  },
];

const perks = [
  { icon: "🌍", title: "عمل عن بُعد", description: "اشتغل من أي مكان في العالم" },
  { icon: "📈", title: "نمو سريع", description: "شركة ناشئة بفرص تعلم وتطور كبيرة" },
  { icon: "💰", title: "رواتب منافسة", description: "رواتب تنافسية مع حوافز أداء" },
  { icon: "🎯", title: "تأثير حقيقي", description: "شغلك يوصل لآلاف المستخدمين" },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Rocket size={16} />
            وظائف
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            انضم لفريق
            <br />
            <span className="text-gradient">يبني المستقبل</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            نبحث عن أشخاص شغوفين بالتقنية والإبداع يبون يغيرون طريقة التسويق لأصحاب المشاريع العرب.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {perks.map((perk) => (
            <div key={perk.title} className="text-center p-6 rounded-2xl bg-surface-1 border border-card-border">
              <div className="text-3xl mb-3">{perk.icon}</div>
              <h3 className="font-bold mb-1">{perk.title}</h3>
              <p className="text-muted text-sm">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Openings */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">الوظائف المتاحة</h2>
          <div className="space-y-6">
            {openings.map((job) => (
              <div
                key={job.title}
                className="bg-surface-1 border border-card-border rounded-2xl p-8 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {job.location}
                    </span>
                  </div>
                </div>
                <p className="text-muted mb-4 leading-relaxed">{job.description}</p>
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-2">المتطلبات:</h4>
                  <ul className="space-y-1.5">
                    {job.requirements.map((req) => (
                      <li key={req} className="text-muted text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">&#x2022;</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="mailto:careers@postaty.com"
                  className="inline-block px-6 py-2.5 bg-primary/10 text-primary rounded-xl font-semibold text-sm hover:bg-primary/20 transition-colors"
                >
                  قدّم الآن
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General application */}
      <section className="py-20 px-4 text-center bg-surface-1 border-t border-card-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black mb-4">ما لقيت الوظيفة المناسبة؟</h2>
          <p className="text-muted text-lg mb-8">
            أرسل سيرتك الذاتية ونتواصل معك لما يكون فيه فرصة مناسبة.
          </p>
          <a
            href="mailto:careers@postaty.com"
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            أرسل سيرتك الذاتية
          </a>
        </div>
      </section>
    </div>
  );
}
