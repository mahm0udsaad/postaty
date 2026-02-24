"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import {
  LifeBuoy,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/hooks/use-locale";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

type TicketStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";

const STATUS_CONFIG: Record<TicketStatus, { ar: string; en: string; color: string; bg: string }> = {
  open: { ar: "مفتوح", en: "Open", color: "text-primary", bg: "bg-primary/10" },
  in_progress: { ar: "قيد العمل", en: "In Progress", color: "text-accent", bg: "bg-accent/10" },
  waiting_on_customer: { ar: "بانتظار ردك", en: "Awaiting reply", color: "text-amber-500", bg: "bg-amber-500/10" },
  resolved: { ar: "تم الحل", en: "Resolved", color: "text-success", bg: "bg-success/10" },
  closed: { ar: "مغلق", en: "Closed", color: "text-muted", bg: "bg-muted/10" },
};

export default function SupportPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();
  const { data, mutate } = useSWR(
    isSignedIn ? "/api/support" : null,
    fetcher
  );

  const [showNewForm, setShowNewForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim() || formState === "sending") return;
    setFormState("sending");
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      setFormState("sent");
      setSubject("");
      setMessage("");
      mutate();
      setTimeout(() => {
        setShowNewForm(false);
        setFormState("idle");
      }, 2000);
    } catch {
      setFormState("idle");
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-muted" />
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <LifeBuoy size={48} className="text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">{t("الدعم الفني", "Support")}</h1>
          <p className="text-muted mb-6">
            {t("سجل دخولك للتواصل مع الدعم الفني.", "Sign in to contact support.")}
          </p>
          <Link
            href="/sign-in?redirect_url=/support"
            className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            {t("تسجيل الدخول", "Sign in")}
          </Link>
        </div>
      </main>
    );
  }

  const tickets = data?.tickets ?? [];

  return (
    <main className="min-h-screen pt-8 pb-32 px-4 md:pt-16 md:pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">{t("الدعم الفني", "Support")}</h1>
            <p className="text-muted text-sm">
              {t("تذاكر الدعم والمساعدة", "Your support tickets")}
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {t("تذكرة جديدة", "New ticket")}
          </button>
        </div>

        {/* New ticket form */}
        {showNewForm && (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-6 mb-6">
            {formState === "sent" ? (
              <div className="flex items-center justify-center gap-2 text-success font-medium py-4">
                <CheckCircle2 size={18} />
                <span>{t("تم إرسال التذكرة بنجاح!", "Ticket submitted successfully!")}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("الموضوع", "Subject")}
                  className="w-full px-4 py-2.5 bg-surface-2/50 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("اكتب رسالتك...", "Write your message...")}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-2/50 border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={formState === "sending" || !subject.trim() || !message.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {formState === "sending" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {t("إرسال", "Send")}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setSubject("");
                      setMessage("");
                    }}
                    className="px-4 py-2.5 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {t("إلغاء", "Cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tickets list */}
        {!data ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={32} className="animate-spin text-muted" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket: any) => {
              const statusCfg =
                STATUS_CONFIG[ticket.status as TicketStatus] ?? STATUS_CONFIG.open;
              return (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="block bg-surface-1 border border-card-border rounded-2xl p-5 hover:bg-surface-2/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-sm line-clamp-1">
                      {ticket.subject}
                    </h3>
                    <span
                      className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      {locale === "ar" ? statusCfg.ar : statusCfg.en}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>
                      {new Date(ticket.created_at).toLocaleDateString(
                        locale === "ar" ? "ar-SA" : "en-US"
                      )}
                    </span>
                    {ticket.updated_at !== ticket.created_at && (
                      <span>
                        {t("آخر تحديث:", "Updated:")}{" "}
                        {new Date(ticket.updated_at).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US"
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
            <MessageSquare size={48} className="text-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">
              {t("لا توجد تذاكر", "No tickets")}
            </h3>
            <p className="text-muted text-sm">
              {t(
                "لم تقم بإنشاء أي تذكرة دعم بعد.",
                "You haven't created any support tickets yet."
              )}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
