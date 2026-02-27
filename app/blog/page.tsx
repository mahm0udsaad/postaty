import type { Metadata } from "next";
import { BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { getRequestLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  if (locale === "en") {
    return {
      title: "Blog | Postaty",
      description: "Marketing tips and design ideas for business owners from the Postaty team",
    };
  }
  return {
    title: "المدونة | Postaty",
    description: "نصائح تسويقية وأفكار تصميم لأصحاب المشاريع — من فريق Postaty",
  };
}

const posts = {
  ar: [
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
  ],
  en: [
    {
      slug: "ai-design-for-restaurants",
      title: "How to use AI to design restaurant ads",
      excerpt: "A practical guide for restaurant and cafe owners to create social media posters with AI, no design background needed.",
      category: "Marketing",
      date: "2026-02-15",
      readTime: "5 min",
    },
    {
      slug: "social-media-sizes-guide",
      title: "Social media image size guide (2026)",
      excerpt: "Everything you need to know about ideal dimensions for Instagram, Facebook, X, TikTok, and Snapchat.",
      category: "Guides",
      date: "2026-02-10",
      readTime: "4 min",
    },
    {
      slug: "food-photography-tips",
      title: "7 phone photography tips for product shots",
      excerpt: "No expensive camera required. Use these tips to capture studio-level product images with your phone.",
      category: "Tips",
      date: "2026-02-05",
      readTime: "6 min",
    },
  ],
} as const;

function formatDate(dateStr: string, locale: "ar" | "en") {
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const locale = await getRequestLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <BookOpen size={16} />
            {t("المدونة", "Blog")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            {t("نصائح وأفكار", "Tips and ideas")}
            <br />
            <span className="text-gradient">{t("لتسويق أذكى", "for smarter marketing")}</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t("مقالات عملية تساعدك تسوّق لمشروعك بذكاء وتوصل لعملاء أكثر.", "Practical articles to help you market smarter and reach more customers.")}
          </p>
        </div>
      </section>

      <section className="py-12 px-4 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts[locale].map((post) => (
            <article
              key={post.slug}
              className="group bg-surface-1 border border-card-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="h-2 bg-gradient-to-r from-primary to-accent" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {post.category}
                  </span>
                  <span className="text-muted/50 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(post.date, locale)}
                  </span>
                </div>
                <h2 className="text-lg font-bold mb-3 leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted/50 text-xs">{post.readTime} {t("قراءة", "read")}</span>
                  <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t("اقرأ المزيد", "Read more")}
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
