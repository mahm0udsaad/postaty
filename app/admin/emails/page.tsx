"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  Loader2,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";

type Audience = "all" | "paid" | "low_balance";

type SendSummary = {
  total: number;
  sent: number;
  failed: number;
  failures?: Array<{ email: string; reason: string }>;
};

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string; hint: string }> = [
  { value: "all", label: "كل المستخدمين", hint: "إرسال لجميع المستخدمين النشطين" },
  { value: "paid", label: "المشتركين فقط", hint: "المستخدمون الذين لديهم خطة مدفوعة" },
  { value: "low_balance", label: "رصيد منخفض", hint: "المستخدمون القريبون من نفاد الرصيد" },
];

export default function AdminEmailsPage() {
  const [campaignGoal, setCampaignGoal] = useState("عرض خاص على خطط Postaty لفترة محدودة");
  const [offerDetails, setOfferDetails] = useState("احصل على خصم 20% عند الاشتراك الشهري");
  const [ctaUrl, setCtaUrl] = useState("https://www.postaty.com/pricing");
  const [audience, setAudience] = useState<Audience>("paid");
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(20);
  const [notifyInApp, setNotifyInApp] = useState(true);

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [templateSource, setTemplateSource] = useState<"ai" | "default" | null>(null);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingDefault, setIsGeneratingDefault] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [isSendingBalanceReminder, setIsSendingBalanceReminder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SendSummary | null>(null);

  const selectedAudience = useMemo(
    () => AUDIENCE_OPTIONS.find((option) => option.value === audience),
    [audience]
  );

  const handleGenerateTemplate = async (useAi: boolean) => {
    if (!campaignGoal.trim()) {
      setError("يرجى كتابة هدف الحملة أولاً.");
      return;
    }

    setError(null);
    setSummary(null);
    if (useAi) {
      setIsGeneratingAi(true);
    } else {
      setIsGeneratingDefault(true);
    }

    try {
      const res = await fetch('/api/admin/emails/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignGoal: campaignGoal.trim(),
          offerDetails: offerDetails.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
          useAi,
        }),
      });
      if (!res.ok) throw new Error('فشل توليد القالب');
      const result = await res.json();

      setSubject(result.subject);
      setHtml(result.html);
      setPlainText(result.text);
      setTemplateSource(result.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل توليد القالب");
    } finally {
      if (useAi) {
        setIsGeneratingAi(false);
      } else {
        setIsGeneratingDefault(false);
      }
    }
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !html.trim()) {
      setError("يرجى توليد القالب أو كتابة الموضوع والمحتوى قبل الإرسال.");
      return;
    }

    setError(null);
    setSummary(null);
    setIsSendingCampaign(true);

    try {
      const res = await fetch('/api/admin/emails/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          subject: subject.trim(),
          html: html.trim(),
          plainText: plainText.trim() || undefined,
          lowBalanceThreshold: audience === "low_balance" ? lowBalanceThreshold : undefined,
          notifyInApp,
        }),
      });
      if (!res.ok) throw new Error('فشل إرسال الحملة');
      const result = await res.json();
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إرسال الحملة");
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleSendBalanceReminder = async () => {
    setError(null);
    setSummary(null);
    setIsSendingBalanceReminder(true);

    try {
      const res = await fetch('/api/admin/emails/balance-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: lowBalanceThreshold,
        }),
      });
      if (!res.ok) throw new Error('فشل إرسال تنبيهات الرصيد');
      const result = await res.json();
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إرسال تنبيهات الرصيد");
    } finally {
      setIsSendingBalanceReminder(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Mail size={20} className="text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">إدارة البريد التسويقي</h1>
        </div>
        <p className="text-sm text-muted">
          إرسال حملات بريدية للمستخدمين + إشعارات الرصيد المنخفض. يمكنك توليد القالب بالذكاء الاصطناعي أو استخدام قالب افتراضي.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-surface-1 border border-card-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-lg">إعداد الحملة</h2>

          <div>
            <label className="block text-sm font-medium mb-1">هدف الحملة *</label>
            <textarea
              value={campaignGoal}
              onChange={(event) => setCampaignGoal(event.target.value)}
              rows={2}
              placeholder="مثال: أطلقنا مميزات جديدة تساعدك في إنتاج منشورات أسرع"
              className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">تفاصيل العرض</label>
            <textarea
              value={offerDetails}
              onChange={(event) => setOfferDetails(event.target.value)}
              rows={2}
              placeholder="مثال: خصم 20% على خطة Growth حتى نهاية الأسبوع"
              className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رابط الدعوة (CTA)</label>
            <input
              dir="ltr"
              value={ctaUrl}
              onChange={(event) => setCtaUrl(event.target.value)}
              placeholder="https://www.postaty.com/pricing"
              className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => void handleGenerateTemplate(true)}
              disabled={isGeneratingAi || isGeneratingDefault}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isGeneratingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              توليد بالذكاء الاصطناعي
            </button>

            <button
              onClick={() => void handleGenerateTemplate(false)}
              disabled={isGeneratingAi || isGeneratingDefault}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-card-border hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              {isGeneratingDefault ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              قالب افتراضي
            </button>
          </div>

          {templateSource && (
            <p className="text-xs text-muted">
              مصدر القالب:{" "}
              <span className="font-bold text-foreground">
                {templateSource === "ai" ? "AI" : "Default"}
              </span>
            </p>
          )}
        </div>

        <div className="bg-surface-1 border border-card-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-lg">خيارات الإرسال</h2>

          <div>
            <label className="block text-sm font-medium mb-1">الشريحة المستهدفة</label>
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as Audience)}
              className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">{selectedAudience?.hint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">حد الرصيد المنخفض</label>
            <input
              type="number"
              min={1}
              value={lowBalanceThreshold}
              onChange={(event) => setLowBalanceThreshold(Number(event.target.value) || 1)}
              className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted mt-1">يُستخدم عند اختيار شريحة الرصيد المنخفض.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={notifyInApp}
              onChange={(event) => setNotifyInApp(event.target.checked)}
              className="size-4 accent-primary"
            />
            إرسال إشعار داخل التطبيق مع البريد
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => void handleSendCampaign()}
              disabled={isSendingCampaign || isSendingBalanceReminder}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-success hover:bg-success/90 transition-colors disabled:opacity-50"
            >
              {isSendingCampaign ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              إرسال الحملة
            </button>

            <button
              onClick={() => void handleSendBalanceReminder()}
              disabled={isSendingCampaign || isSendingBalanceReminder}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-card-border hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              {isSendingBalanceReminder ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
              تنبيه الرصيد
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface-1 border border-card-border rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">محتوى البريد</h2>
        <p className="text-xs text-muted">
          يمكنك استخدام <code>{"{{name}}"}</code> داخل النص ليتم استبداله باسم المستخدم عند الإرسال.
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">الموضوع *</label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="عنوان البريد"
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">HTML *</label>
          <textarea
            dir="ltr"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            rows={14}
            placeholder="<div>...</div>"
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">نص بديل (اختياري)</label>
          <textarea
            value={plainText}
            onChange={(event) => setPlainText(event.target.value)}
            rows={5}
            placeholder="النص البديل لعملاء البريد الذين لا يدعمون HTML"
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </div>
      </section>

      {summary && (
        <section className="bg-surface-1 border border-card-border rounded-2xl p-5 space-y-2">
          <h3 className="font-bold">نتيجة الإرسال</h3>
          <p className="text-sm">
            إجمالي: <span className="font-bold">{summary.total}</span> | تم الإرسال:{" "}
            <span className="font-bold text-success">{summary.sent}</span> | فشل:{" "}
            <span className="font-bold text-destructive">{summary.failed}</span>
          </p>
          {summary.failures && summary.failures.length > 0 && (
            <div className="text-xs text-destructive space-y-1">
              {summary.failures.map((failure) => (
                <p key={failure.email}>
                  {failure.email}: {failure.reason}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {error && (
        <section className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-sm text-destructive">
          {error}
        </section>
      )}
    </div>
  );
}
