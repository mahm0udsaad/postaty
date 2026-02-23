"use client";

import useSWR from "swr";
import {
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

type RatingFilter = "all" | "like" | "dislike";

export default function AdminFeedbackPage() {
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const { data: feedbackData } = useSWR('/api/admin/feedback', fetcher);
  const { data: feedback } = useSWR(
    `/api/admin/feedback/list?limit=100${ratingFilter !== "all" ? `&rating=${ratingFilter}` : ''}`,
    fetcher
  );

  const summary = feedbackData?.summary;

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">التقييمات</h1>
        <p className="text-muted">تقييمات المستخدمين للتصاميم المولدة</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-1 border border-card-border rounded-2xl p-5 text-center">
          <div className="text-2xl font-black">{summary.total}</div>
          <div className="text-xs text-muted mt-1 flex items-center justify-center gap-1">
            <MessageSquare size={12} />
            إجمالي التقييمات
          </div>
        </div>
        <div className="bg-success/5 border border-success/20 rounded-2xl p-5 text-center">
          <div className="text-2xl font-black text-success">{summary.likes}</div>
          <div className="text-xs text-muted mt-1 flex items-center justify-center gap-1">
            <ThumbsUp size={12} className="text-success" />
            إعجاب
          </div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 text-center">
          <div className="text-2xl font-black text-destructive">{summary.dislikes}</div>
          <div className="text-xs text-muted mt-1 flex items-center justify-center gap-1">
            <ThumbsDown size={12} className="text-destructive" />
            عدم إعجاب
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
          <div className="text-2xl font-black text-primary">{(summary.likeRate * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted mt-1 flex items-center justify-center gap-1">
            <TrendingUp size={12} className="text-primary" />
            نسبة الإعجاب
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {([
          { label: "الكل", value: "all" as const },
          { label: "إعجاب", value: "like" as const },
          { label: "عدم إعجاب", value: "dislike" as const },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setRatingFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              ratingFilter === f.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-surface-2/50 text-muted hover:text-foreground border border-card-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      {!feedback ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : feedback.length > 0 ? (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-2/30">
                  <th className="text-right py-3 px-4 font-medium text-muted">التقييم</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">المستخدم</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الفئة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">النموذج</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">التعليق</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item: any) => {
                  const itemId = item.id ?? item._id;
                  const userName = item.user_name ?? item.userName;
                  const userEmail = item.user_email ?? item.userEmail;
                  const createdAt = item.created_at ?? item.createdAt;
                  return (
                    <tr key={itemId} className="border-b border-card-border/50 hover:bg-surface-2/20 transition-colors">
                      <td className="py-3 px-4">
                        {item.rating === "like" ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-bold">
                            <ThumbsUp size={12} />
                            إعجاب
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-destructive/10 text-destructive rounded-full text-xs font-bold">
                            <ThumbsDown size={12} />
                            عدم إعجاب
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs">{userName}</div>
                        <div className="text-[10px] text-muted">{userEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {item.category
                          ? (CATEGORY_LABELS as Record<string, string>)[item.category] ?? item.category
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {item.model ? (
                          <code className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded">{item.model}</code>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs max-w-[200px]">
                        {item.comment ? (
                          <p className="line-clamp-2">{item.comment}</p>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted whitespace-nowrap">
                        {new Date(createdAt).toLocaleDateString("ar-SA")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <ThumbsUp size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد تقييمات</h3>
          <p className="text-muted text-sm">
            {ratingFilter !== "all"
              ? "لا توجد تقييمات في هذا التصنيف."
              : "ستظهر التقييمات هنا عندما يبدأ المستخدمون بتقييم التصاميم."}
          </p>
        </div>
      )}
    </div>
  );
}
