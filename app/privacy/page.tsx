import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Postaty",
  description: "سياسة الخصوصية لمنصة Postaty — كيف نجمع ونستخدم ونحمي بياناتك",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-4">سياسة الخصوصية</h1>
        <p className="text-muted mb-12">آخر تحديث: 1 فبراير 2026</p>

        <div className="prose-custom space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">مقدمة</h2>
            <p className="text-muted leading-relaxed">
              نحن في Postaty نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيف نجمع ونستخدم ونحمي المعلومات التي تقدمها لنا عند استخدام منصتنا.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">البيانات التي نجمعها</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">بيانات الحساب</h3>
                <p>عند إنشاء حساب، نجمع اسمك وبريدك الإلكتروني ومعلومات تسجيل الدخول من خلال مزود المصادقة (Clerk).</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">بيانات الاستخدام</h3>
                <p>نجمع معلومات عن كيفية استخدامك للمنصة، مثل التصاميم التي تنشئها والميزات التي تستخدمها، لتحسين خدماتنا.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">الصور والمحتوى</h3>
                <p>الصور التي ترفعها لإنشاء التصاميم تُستخدم فقط لغرض توليد التصميم ولا يتم مشاركتها مع أطراف ثالثة.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">بيانات الدفع</h3>
                <p>تتم معالجة المدفوعات من خلال Stripe. نحن لا نخزن بيانات بطاقتك الائتمانية على خوادمنا.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">كيف نستخدم بياناتك</h2>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                تقديم خدمات المنصة وتحسينها
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                إدارة حسابك واشتراكك
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                التواصل معك بخصوص تحديثات الخدمة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                تحليل أنماط الاستخدام لتحسين تجربة المستخدم
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                الامتثال للمتطلبات القانونية
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">حماية البيانات</h2>
            <p className="text-muted leading-relaxed">
              نستخدم تقنيات تشفير متقدمة لحماية بياناتك أثناء النقل والتخزين. نلتزم بأفضل الممارسات الأمنية ونراجع إجراءاتنا بشكل دوري لضمان سلامة معلوماتك.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">مشاركة البيانات</h2>
            <p className="text-muted leading-relaxed">
              لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك بيانات محدودة مع مزودي الخدمات الذين يساعدوننا في تشغيل المنصة (مثل Stripe للمدفوعات و Clerk للمصادقة)، وذلك فقط بالقدر اللازم لتقديم الخدمة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">حقوقك</h2>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                الوصول إلى بياناتك الشخصية وتحديثها
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                طلب حذف حسابك وبياناتك
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                إلغاء الاشتراك في الرسائل التسويقية
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                تصدير بياناتك
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-muted leading-relaxed">
              نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة وتحسين تجربتك. تشمل هذه ملفات تعريف الارتباط للمصادقة وتفضيلات العرض.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">تحديثات السياسة</h2>
            <p className="text-muted leading-relaxed">
              قد نحدّث هذه السياسة من وقت لآخر. سنُعلمك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">تواصل معنا</h2>
            <p className="text-muted leading-relaxed">
              إذا كان لديك أي أسئلة حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني على{" "}
              <a href="mailto:privacy@postaty.com" className="text-primary hover:underline">
                privacy@postaty.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
