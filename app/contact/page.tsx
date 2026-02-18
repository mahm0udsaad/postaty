import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "اتصل بنا | Postaty",
  description: "تواصل مع فريق Postaty — نحب نسمع منك سواء كان سؤال أو اقتراح أو شراكة",
};

const contactMethods = [
  {
    icon: Mail,
    title: "البريد الإلكتروني",
    description: "أرسل لنا وبنرد خلال 24 ساعة",
    value: "hello@postaty.com",
    href: "mailto:hello@postaty.com",
  },
  {
    icon: MessageCircle,
    title: "واتساب",
    description: "تواصل معنا مباشرة",
    value: "+966 50 000 0000",
    href: "https://wa.me/9665000000000",
  },
  {
    icon: MapPin,
    title: "الموقع",
    description: "مقرنا الرئيسي",
    value: "الرياض، المملكة العربية السعودية",
    href: null,
  },
  {
    icon: Clock,
    title: "ساعات العمل",
    description: "الأحد - الخميس",
    value: "9:00 ص - 6:00 م (توقيت السعودية)",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            نحب نسمع
            <br />
            <span className="text-gradient">منك</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            عندك سؤال؟ اقتراح؟ تبي شراكة؟ فريقنا جاهز يساعدك.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {contactMethods.map((method) => (
            <div
              key={method.title}
              className="bg-surface-1 border border-card-border rounded-2xl p-8 hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <method.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-1">{method.title}</h3>
              <p className="text-muted text-sm mb-3">{method.description}</p>
              {method.href ? (
                <a
                  href={method.href}
                  className="text-primary font-semibold hover:underline"
                >
                  {method.value}
                </a>
              ) : (
                <span className="text-foreground font-semibold">{method.value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-8 text-center">أرسل لنا رسالة</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">الاسم</label>
                <input
                  type="text"
                  placeholder="اسمك الكامل"
                  className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors text-left"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">الموضوع</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground focus:outline-none focus:border-primary transition-colors">
                <option value="">اختر الموضوع</option>
                <option value="support">دعم فني</option>
                <option value="billing">استفسار عن الاشتراك</option>
                <option value="partnership">شراكات</option>
                <option value="feedback">اقتراحات</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">الرسالة</label>
              <textarea
                rows={5}
                placeholder="اكتب رسالتك هنا..."
                className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              أرسل الرسالة
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
