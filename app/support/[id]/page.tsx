"use client";

import { useState, useRef, useEffect, use } from "react";
import useSWR from "swr";
import {
  ArrowRight,
  Loader2,
  Send,
  Shield,
  User,
  LifeBuoy,
} from "lucide-react";
import Link from "next/link";
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
  waiting_on_customer: { ar: "بانتظار ردك", en: "Awaiting your reply", color: "text-amber-500", bg: "bg-amber-500/10" },
  resolved: { ar: "تم الحل", en: "Resolved", color: "text-success", bg: "bg-success/10" },
  closed: { ar: "مغلق", en: "Closed", color: "text-muted", bg: "bg-muted/10" },
};

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locale, t } = useLocale();
  const { data, mutate } = useSWR(`/api/support/${id}`, fetcher);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  if (!data) {
    return (
      <main className="min-h-screen pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-muted" />
        </div>
      </main>
    );
  }

  const { ticket, messages } = data;
  const statusCfg = STATUS_CONFIG[ticket.status as TicketStatus] ?? STATUS_CONFIG.open;

  const handleSendReply = async () => {
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    try {
      await fetch(`/api/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      setReply("");
      mutate();
    } catch (err) {
      console.error("Reply failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen pt-8 pb-32 px-4 md:pt-16 md:pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowRight size={16} />
          {t("العودة للتذاكر", "Back to tickets")}
        </Link>

        {/* Ticket header */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-black">{ticket.subject}</h1>
            <span
              className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}
            >
              {locale === "ar" ? statusCfg.ar : statusCfg.en}
            </span>
          </div>
          <p className="text-xs text-muted">
            {new Date(ticket.created_at).toLocaleDateString(
              locale === "ar" ? "ar-SA-u-nu-latn" : "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-4">
          {messages.map((msg: any) => {
            const isAdmin = msg.is_admin;
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    isAdmin
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-surface-1 border border-card-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isAdmin ? (
                      <Shield size={12} className="text-primary" />
                    ) : (
                      <User size={12} className="text-muted" />
                    )}
                    <span className="text-[10px] font-bold text-muted">
                      {isAdmin
                        ? t("الدعم الفني", "Support")
                        : t("أنت", "You")}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(msg.created_at).toLocaleString(
                        locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"
                      )}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply box */}
        {ticket.status !== "closed" ? (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-4">
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t("اكتب ردك هنا...", "Write your reply...")}
                rows={2}
                className="flex-1 px-4 py-2 bg-surface-2/50 border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!reply.trim() || isSending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-2/30 border border-card-border rounded-2xl p-4 text-center text-sm text-muted">
            {t("هذه التذكرة مغلقة.", "This ticket is closed.")}
          </div>
        )}
      </div>
    </main>
  );
}
