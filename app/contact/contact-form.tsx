"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

const SUBJECTS: Record<string, string> = {
  support: "دعم فني",
  billing: "استفسار عن الاشتراك",
  partnership: "شراكات",
  feedback: "اقتراحات",
  other: "أخرى",
};

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setStatus("sending");

    const subjectText = `[${SUBJECTS[subject] ?? subject}] رسالة من ${name}`;
    const body = `الاسم: ${name}\nالبريد: ${email}\nالموضوع: ${SUBJECTS[subject] ?? subject}\n\n${message}`;
    const mailto = `mailto:hello@postaty.com?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    setTimeout(() => {
      setStatus("sent");
    }, 500);
  };

  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">تم فتح تطبيق البريد</h3>
        <p className="text-muted">أرسل الرسالة من تطبيق البريد الإلكتروني وسنرد عليك في أقرب وقت.</p>
        <button
          onClick={() => {
            setName("");
            setEmail("");
            setSubject("");
            setMessage("");
            setStatus("idle");
          }}
          className="mt-6 px-6 py-3 bg-surface-2 border border-card-border rounded-xl font-bold hover:bg-surface-1 transition-colors"
        >
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2">الاسم</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك الكامل"
            className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors text-left"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">الموضوع</label>
        <select
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground focus:outline-none focus:border-primary transition-colors"
        >
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
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50"
      >
        {status === "sending" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            جاري الإرسال...
          </span>
        ) : (
          "أرسل الرسالة"
        )}
      </button>
    </form>
  );
}
