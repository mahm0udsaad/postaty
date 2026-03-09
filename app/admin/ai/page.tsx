"use client";

import useSWR from "swr";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ImageIcon,
  Loader2,
  RefreshCw,
  Server,
} from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error("API error");
    return response.json();
  });

const PERIOD_OPTIONS = [
  { label: "7 أيام", value: 7 },
  { label: "30 يوم", value: 30 },
  { label: "90 يوم", value: 90 },
];

type ProviderStats = {
  count: number;
  cost: number;
  images: number;
  successCount: number;
  failureCount: number;
};

type ModelStats = {
  count: number;
  cost: number;
  images: number;
  avgDurationMs: number;
  providers: string[];
};

type GenerationSummary = {
  generationId: string;
  generationType: string;
  route: string;
  providers: string[];
  models: string[];
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  success: boolean;
  fallbackUsed: boolean;
};

type DailyUsagePoint = {
  date: string;
  requests: number;
  cost: number;
};

function formatCoverageDate(value: number | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-CA");
}

export default function AdminAiPage() {
  const [periodDays, setPeriodDays] = useState(30);
  const [generationPage, setGenerationPage] = useState(1);
  const { data: overviewData } = useSWR(
    `/api/admin/overview?periodDays=${periodDays}`,
    fetcher
  );
  const { data: dailyUsageData } = useSWR(
    `/api/admin/daily-usage?periodDays=${periodDays}`,
    fetcher
  );

  const overview = overviewData?.ai;
  const dailyUsage = dailyUsageData?.dailyUsage;

  if (!overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  const maxDailyRequests = dailyUsage
    ? Math.max(...dailyUsage.map((day: { requests: number }) => day.requests), 1)
    : 1;
  const providerRows = Object.entries(overview.byProvider ?? {});
  const modelRows = Object.entries(overview.byModel ?? {});
  const generationRows = overview.generationSummaries ?? [];
  const GENERATIONS_PER_PAGE = 10;
  const totalGenerationPages = Math.max(
    1,
    Math.ceil(generationRows.length / GENERATIONS_PER_PAGE)
  );
  const paginatedGenerationRows = generationRows.slice(
    (generationPage - 1) * GENERATIONS_PER_PAGE,
    generationPage * GENERATIONS_PER_PAGE
  );

  const changePeriod = (nextPeriodDays: number) => {
    setPeriodDays(nextPeriodDays);
    setGenerationPage(1);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-black">تحليلات AI الدقيقة</h1>
          <p className="text-muted">
            مبنية على الاستهلاك الفعلي من المزود مع تتبع منفصل لـ Google و Vercel Gateway
          </p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => changePeriod(option.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                periodDays === option.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "border border-card-border bg-surface-2/50 text-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-card-border bg-surface-1 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-accent" size={18} />
          <div>
            <p className="font-semibold">نطاق الدقة المالية</p>
            <p className="text-sm text-muted">
              يتم احتساب التكلفة الدقيقة فقط من{" "}
              <span className="font-mono text-foreground">
                {formatCoverageDate(overview.exactCostCoverageStart)}
              </span>{" "}
              وما بعده. البيانات الأقدم غير داخلة في إجماليات الدقة.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          icon={Activity}
          label="إجمالي الطلبات"
          value={overview.totalRequests}
          tone="primary"
        />
        <MetricCard
          icon={CheckCircle2}
          label="نسبة النجاح"
          value={`${(overview.successRate * 100).toFixed(1)}%`}
          subtext={`${overview.successCount} ناجح / ${overview.failureCount} فاشل`}
          tone="success"
        />
        <MetricCard
          icon={DollarSign}
          label="التكلفة الدقيقة"
          value={`$${overview.exactApiCostUsd.toFixed(4)}`}
          tone="accent"
        />
        <MetricCard
          icon={ImageIcon}
          label="الصور المولدة"
          value={overview.totalImages}
          tone="primary"
        />
        <MetricCard
          icon={Clock}
          label="متوسط تكلفة التصميم"
          value={`$${overview.avgCostPerSuccessfulDesign.toFixed(4)}`}
          subtext="للتصاميم الناجحة فقط"
          tone="accent"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-surface-1 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Server size={18} className="text-primary" />
            <h3 className="font-bold">التكلفة حسب المزود</h3>
          </div>
          <div className="space-y-3">
            {providerRows.length === 0 ? (
              <p className="text-sm text-muted">لا توجد بيانات مزودين في الفترة المحددة.</p>
            ) : (
              providerRows.map(([provider, stats]: [string, ProviderStats]) => (
                <div
                  key={provider}
                  className="rounded-xl border border-card-border bg-surface-2/40 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <code className="text-xs">{provider}</code>
                    <span className="font-bold">${Number(stats.cost).toFixed(4)}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted">
                    <span>{stats.count} طلب</span>
                    <span>{stats.images} صورة</span>
                    <span>{stats.successCount} ناجح</span>
                    <span>{stats.failureCount} فاشل</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-surface-1 p-6">
          <div className="mb-4 flex items-center gap-3">
            <RefreshCw size={18} className="text-accent" />
            <h3 className="font-bold">إشارات التدقيق</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">عدد السقوط إلى Gateway</span>
              <span className="font-bold">{overview.fallbackCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">التغطية الدقيقة تبدأ من</span>
              <span className="font-mono font-bold">
                {formatCoverageDate(overview.exactCostCoverageStart)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">متوسط تكلفة التصميم الناجح</span>
              <span className="font-bold">
                ${overview.avgCostPerSuccessfulDesign.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {modelRows.length > 0 && (
        <div className="mb-8 rounded-2xl border border-card-border bg-surface-1 p-6">
          <h3 className="mb-4 font-bold text-lg">الاستخدام حسب النموذج</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-3 text-right font-medium text-muted">النموذج</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">المزود</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">الطلبات</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">التكلفة</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">الصور</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">متوسط المدة</th>
                </tr>
              </thead>
              <tbody>
                {modelRows.map(([model, stats]: [string, ModelStats]) => (
                  <tr key={model} className="border-b border-card-border/50">
                    <td className="px-3 py-3">
                      <code className="rounded-lg bg-surface-2 px-2 py-1 text-xs">
                        {model}
                      </code>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {(stats.providers ?? []).join(", ")}
                    </td>
                    <td className="px-3 py-3 font-bold">{stats.count}</td>
                    <td className="px-3 py-3 font-bold">
                      ${Number(stats.cost).toFixed(4)}
                    </td>
                    <td className="px-3 py-3">{stats.images}</td>
                    <td className="px-3 py-3">
                      {(Number(stats.avgDurationMs) / 1000).toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {generationRows.length > 0 && (
        <div className="mb-8 rounded-2xl border border-card-border bg-surface-1 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-bold text-lg">تكلفة كل تصميم</h3>
            <div className="text-xs text-muted">
              صفحة {generationPage} من {totalGenerationPages}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-3 text-right font-medium text-muted">المعرف</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">النوع</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">المزود</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">النماذج</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">التوكنز</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">التكلفة</th>
                  <th className="px-3 py-3 text-right font-medium text-muted">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGenerationRows.map((row: GenerationSummary) => (
                  <tr key={`${row.generationType}:${row.generationId}`} className="border-b border-card-border/50">
                    <td className="px-3 py-3 font-mono text-xs">{row.generationId}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{row.generationType}</div>
                      <div className="text-xs text-muted">{row.route}</div>
                    </td>
                    <td className="px-3 py-3 text-xs">{row.providers.join(", ")}</td>
                    <td className="px-3 py-3 text-xs">{row.models.join(", ")}</td>
                    <td className="px-3 py-3 text-xs text-muted">
                      in {row.inputTokens} / out {row.outputTokens}
                    </td>
                    <td className="px-3 py-3 font-bold">
                      ${Number(row.totalCostUsd).toFixed(4)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                          row.success
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {row.success ? "ناجح" : "فاشل"}
                      </span>
                      {row.fallbackUsed && (
                        <span className="mr-2 inline-flex rounded-full bg-accent/10 px-2 py-1 text-xs font-bold text-accent">
                          fallback
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalGenerationPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-muted">
                عرض {(generationPage - 1) * GENERATIONS_PER_PAGE + 1}-
                {Math.min(generationPage * GENERATIONS_PER_PAGE, generationRows.length)} من{" "}
                {generationRows.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGenerationPage((page) => Math.max(1, page - 1))}
                  disabled={generationPage === 1}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  السابق
                </button>
                <button
                  onClick={() =>
                    setGenerationPage((page) => Math.min(totalGenerationPages, page + 1))
                  }
                  disabled={generationPage === totalGenerationPages}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {dailyUsage && dailyUsage.length > 0 && (
        <div className="rounded-2xl border border-card-border bg-surface-1 p-6">
          <h3 className="mb-4 font-bold text-lg">الاستخدام اليومي الدقيق</h3>
          <div className="space-y-2">
            {dailyUsage.map((day: DailyUsagePoint) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="w-20 shrink-0 font-mono text-xs text-muted">
                  {day.date.slice(5)}
                </span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-surface-2/50">
                  <div
                    className="h-full rounded-lg bg-gradient-to-l from-primary to-primary/60"
                    style={{ width: `${(day.requests / maxDailyRequests) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-left text-xs font-bold">{day.requests}</span>
                <span className="w-16 text-left text-xs text-muted">
                  ${Number(day.cost).toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  tone: "primary" | "accent" | "success";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "accent"
        ? "bg-accent/10 text-accent"
        : "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl border border-card-border bg-surface-1 p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className={`rounded-xl p-2 ${toneClasses}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      {subtext ? <div className="mt-1 text-xs text-muted">{subtext}</div> : null}
    </div>
  );
}
