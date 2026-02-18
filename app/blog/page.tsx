import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Calendar, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "المدونة | Postaty",
  description: "نصائح تسويقية وأفكار تصميم لأصحاب المشاريع — من فريق Postaty",
};

const posts = [
  {
    slug: "ai-design-for-restaurants",
    title: "كيف تستخدم الذكاء الاصطناعي لتصميم إعلانات مطعمك",
    excerpt: "دليل عملي لأصحاب المطاعم والكافيهات لاستخدام أدوات الذكاء الاصطناعي في تصميم بوسترات سوشيال ميديا احترافية بدون خبرة.",
    category: "تسويق رقمي",
    date: "2026-02-15",
    readTime: "5 دقائق",
  },
  {
    slug: "social-media-sizes-guide",
    title: "دليل أحجام صور السوشيال ميديا في 2026",
    excerpt: "كل ما تحتاج تعرفه عن المقاسات المثالية لكل منصة — انستقرام، فيسبوك، تويتر، تيك توك، وسناب شات.",
    category: "أدلة",
    date: "2026-02-10",
    readTime: "4 دقائق",
  },
  {
    slug: "food-photography-tips",
    title: "7 نصائح لتصوير منتجاتك بجوالك باحترافية",
    excerpt: "ما تحتاج كاميرا غالية — هذي النصائح تخليك تطلع صور منتجات تنافس الاستوديوهات من جوالك.",
    category: "نصائح",
    date: "2026-02-05",
    readTime: "6 دقائق",
  },
  {
    slug: "brand-identity-basics",
    title: "أساسيات الهوية البصرية لمشروعك الصغير",
    excerpt: "الألوان والخطوط واللوقو — كيف تبني هوية بصرية قوية تميّزك عن المنافسين بدون ما تصرف آلاف.",
    category: "تسويق رقمي",
    date: "2026-01-28",
    readTime: "7 دقائق",
  },
  {
    slug: "instagram-marketing-2026",
    title: "استراتيجية انستقرام لمتجرك في 2026",
    excerpt: "من الريلز للستوري للبوستات — خطة عملية تزيد تفاعلك ومبيعاتك على انستقرام.",
    category: "أدلة",
    date: "2026-01-20",
    readTime: "8 دقائق",
  },
  {
    slug: "copywriting-for-offers",
    title: "كيف تكتب عرض يبيع — فن كتابة إعلانات العروض",
    excerpt: "الكلمات الصح تفرق. تعلم كيف تكتب نص إعلاني يخلّي العميل يتفاعل ويشتري.",
    category: "نصائح",
    date: "2026-01-15",
    readTime: "5 دقائق",
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <BookOpen size={16} />
            المدونة
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            نصائح وأفكار
            <br />
            <span className="text-gradient">لتسويق أذكى</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            مقالات عملية تساعدك تسوّق لمشروعك بذكاء وتوصل لعملاء أكثر.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-12 px-4 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group bg-surface-1 border border-card-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
            >
              {/* Colored header strip */}
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {post.category}
                  </span>
                  <span className="text-muted/50 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(post.date)}
                  </span>
                </div>
                <h2 className="text-lg font-bold mb-3 leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted/50 text-xs">{post.readTime} قراءة</span>
                  <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    اقرأ المزيد
                    <ArrowLeft size={14} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
