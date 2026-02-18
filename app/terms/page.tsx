import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الشروط والأحكام | Postaty",
  description: "شروط وأحكام استخدام منصة Postaty لتصميم الإعلانات بالذكاء الاصطناعي",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-4">الشروط والأحكام</h1>
        <p className="text-muted mb-12">آخر تحديث: 1 فبراير 2026</p>

        <div className="prose-custom space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">القبول بالشروط</h2>
            <p className="text-muted leading-relaxed">
              باستخدامك لمنصة Postaty، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">وصف الخدمة</h2>
            <p className="text-muted leading-relaxed">
              Postaty منصة تصميم إعلانات تعمل بالذكاء الاصطناعي، تتيح للمستخدمين إنشاء تصاميم إعلانية احترافية لمنصات التواصل الاجتماعي. تشمل الخدمة توليد التصاميم، تحرير النصوص، وتصدير الملفات بأحجام متعددة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">حسابات المستخدمين</h2>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                يجب أن تكون المعلومات المقدمة عند التسجيل صحيحة ودقيقة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                أنت مسؤول عن الحفاظ على سرية بيانات حسابك
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                يجب ألا يقل عمر المستخدم عن 18 سنة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                يحق لنا تعليق أو إلغاء الحسابات التي تنتهك هذه الشروط
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">الاشتراكات والدفع</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">الباقة المجانية</h3>
                <p>يحصل كل مستخدم جديد على 10 تصاميم مجانية عند التسجيل. لا تتجدد هذه التصاميم المجانية.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">الاشتراكات المدفوعة</h3>
                <p>تتجدد الاشتراكات تلقائياً كل شهر ما لم يتم إلغاؤها قبل تاريخ التجديد. الأسعار قابلة للتغيير مع إشعار مسبق بـ 30 يوماً.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">سياسة الاسترجاع</h3>
                <p>يمكنك إلغاء اشتراكك في أي وقت. لا يتم استرجاع المبالغ المدفوعة للفترة الحالية، لكن ستستمر في الاستفادة من الخدمة حتى نهاية فترة الاشتراك.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">حقوق الملكية الفكرية</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">تصاميمك</h3>
                <p>أنت تملك حقوق التصاميم التي تنشئها باستخدام Postaty. يحق لك استخدامها لأغراض تجارية وشخصية بدون قيود.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">المنصة</h3>
                <p>جميع حقوق الملكية الفكرية للمنصة، بما في ذلك الكود والتصميم والعلامة التجارية، محفوظة لشركة Postaty.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">الاستخدام المقبول</h2>
            <p className="text-muted leading-relaxed mb-4">يُحظر استخدام المنصة لـ:</p>
            <ul className="space-y-3 text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                إنشاء محتوى مخالف للقوانين أو مسيء
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                انتهاك حقوق الملكية الفكرية للآخرين
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                استخدام المنصة بطريقة تضر بالخدمة أو بالمستخدمين الآخرين
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                محاولة الوصول غير المصرح به لأنظمة المنصة
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">&#x2022;</span>
                إعادة بيع الخدمة أو إنشاء خدمة منافسة باستخدام المنصة
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">إخلاء المسؤولية</h2>
            <p className="text-muted leading-relaxed">
              تُقدّم الخدمة &quot;كما هي&quot; بدون ضمانات صريحة أو ضمنية. لا نضمن أن الخدمة ستكون متاحة بشكل مستمر أو خالية من الأخطاء. لا نتحمل المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">حدود المسؤولية</h2>
            <p className="text-muted leading-relaxed">
              في جميع الأحوال، لن تتجاوز مسؤوليتنا المبلغ الذي دفعته لنا خلال الـ 12 شهراً السابقة لتاريخ المطالبة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">التعديلات</h2>
            <p className="text-muted leading-relaxed">
              يحق لنا تعديل هذه الشروط في أي وقت. سنُعلمك بالتغييرات الجوهرية عبر البريد الإلكتروني أو من خلال إشعار على المنصة قبل 30 يوماً من سريان التعديلات.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">القانون الحاكم</h2>
            <p className="text-muted leading-relaxed">
              تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاع ينشأ عن استخدام المنصة يخضع لاختصاص المحاكم في مدينة الرياض.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">تواصل معنا</h2>
            <p className="text-muted leading-relaxed">
              لأي استفسارات حول هذه الشروط، تواصل معنا عبر{" "}
              <a href="mailto:legal@postaty.com" className="text-primary hover:underline">
                legal@postaty.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
