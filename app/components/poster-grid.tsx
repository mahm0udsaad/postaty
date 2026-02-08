"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  DownloadCloud,
  Sparkles,
} from "lucide-react";
import type { PosterResult, PosterGenStep } from "@/lib/types";
import { FORMAT_CONFIGS } from "@/lib/constants";

// ── Generation Steps ──────────────────────────────────────────────

const GENERATION_STEPS: Record<
  PosterGenStep,
  { label: string; sublabel: string }
> = {
  idle: { label: "", sublabel: "" },
  "generating-designs": {
    label: "يصمم الذكاء الاصطناعي 6 تصاميم...",
    sublabel: "يختار الألوان والتخطيط والعناصر",
  },
  complete: { label: "تم بنجاح!", sublabel: "" },
  error: { label: "حدث خطأ", sublabel: "" },
};

// ── Props ─────────────────────────────────────────────────────────

interface PosterGridProps {
  results: PosterResult[];
  genStep: PosterGenStep;
  error?: string;
  totalExpected?: number;
  onSaveAsTemplate?: (designIndex: number) => void;
}

// ── AI State Indicator (Typing Effect) ─────────────────────────────

const AI_MESSAGES = [
  "جاري تحليل بيانات مشروعك...",
  "الذكاء الاصطناعي يختار أفضل الألوان...",
  "تنسيق العناصر بشكل احترافي...",
  "إضافة لمسات إبداعية...",
  "مراجعة جودة التصاميم...",
];

function AiStateIndicator() {
  const [text, setText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [delta, setDelta] = useState(100);

  useEffect(() => {
    const ticker = setInterval(() => {
      tick();
    }, delta);

    return () => clearInterval(ticker);
  }, [text, delta]);

  const tick = () => {
    const i = messageIndex % AI_MESSAGES.length;
    const fullText = AI_MESSAGES[i];
    const updatedText = isDeleting
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    setText(updatedText);

    if (isDeleting) {
      setDelta((prev) => prev / 2);
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setDelta(2000); // Wait before deleting
    } else if (isDeleting && updatedText === "") {
      setIsDeleting(false);
      setMessageIndex((prev) => prev + 1);
      setDelta(100);
    } else {
      // Normal typing speed
      if (!isDeleting && delta === 2000) setDelta(100); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-6">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur opacity-30 animate-pulse" />
        <div className="relative bg-white rounded-full p-4 ring-1 ring-slate-200 shadow-sm">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
      
      <div className="h-8 flex items-center">
        <p className="text-lg md:text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          {text}
          <span className="w-0.5 h-6 ml-1 bg-primary inline-block animate-blink align-middle" />
        </p>
      </div>
    </div>
  );
}

// ── Poster Skeleton ───────────────────────────────────────────────

function PosterSkeleton({ index }: { index: number }) {
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden relative group">
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      
      {/* Skeleton Image Area */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-accent/5 to-primary/5 animate-pulse" />
        
        {/* Modern Shimmer */}
        <div 
          className="absolute inset-0 -translate-x-full" 
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
            animation: 'shimmer 2s infinite cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Floating AI Elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute inset-4 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-slate-100">
               <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          </div>
        </div>
        
        {/* Abstract Shapes */}
        <div className="absolute top-4 left-4 w-16 h-4 bg-white rounded-full blur-[1px]" />
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
      </div>

      {/* Skeleton Footer */}
      <div className="p-5 space-y-4 bg-white/50 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded-full w-3/4 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse delay-75" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse delay-100" />
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse delay-150" />
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/5 animate-pulse delay-200" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function PosterGrid({
  results,
  genStep,
  error,
  totalExpected = results.length || 4,
  onSaveAsTemplate,
}: PosterGridProps) {
  const isLoading = genStep === "generating-designs";
  const [exportingAll, setExportingAll] = useState(false);

  const successResults = results.filter((r) => r.status === "complete");

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      for (const result of successResults) {
        await exportPoster(result);
      }
    } finally {
      setExportingAll(false);
    }
  };

  // Generate an array of indices to render
  const gridItems = Array.from({ length: totalExpected }, (_, i) => i);

  return (
    <div className="space-y-8">
      {/* AI Status Indicator */}
      {isLoading && <AiStateIndicator />}

      {genStep === "complete" && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-6 bg-success/5 border border-success/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-full">
              <CheckCircle2 size={24} className="text-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">تم اكتمال التصميم!</h3>
              <p className="text-muted text-sm">
                تم إنشاء {successResults.length} من {totalExpected} تصاميم بنجاح
              </p>
            </div>
          </div>
          
          {successResults.length > 0 && (
            <button
              type="button"
              onClick={handleExportAll}
              disabled={exportingAll}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-medium"
            >
              {exportingAll ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <DownloadCloud size={18} />
              )}
              تصدير جميع التصاميم
            </button>
          )}
        </div>
      )}

      {genStep === "error" && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-danger/10 rounded-full">
            <XCircle size={40} className="text-danger" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">عذراً، حدث خطأ</h3>
          {error && (
            <p className="max-w-md mx-auto text-muted bg-danger/5 border border-danger/10 rounded-lg p-3 text-sm">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Results Grid - Mix of Cards and Skeletons */}
      {(results.length > 0 || isLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {gridItems.map((index) => {
            const result = results.find(r => r.designIndex === index);
            if (result) {
              return (
                <PosterCard
                  key={result.designIndex}
                  result={result}
                  onSaveAsTemplate={onSaveAsTemplate}
                />
              );
            }
            
            if (isLoading) {
              return <PosterSkeleton key={`skeleton-${index}`} index={index} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Client-side Render Helper ─────────────────────────────────────

async function renderToBlob(html: string, format: string): Promise<Blob> {
  const config = FORMAT_CONFIGS[format as keyof typeof FORMAT_CONFIGS];
  if (!config) throw new Error("Invalid format");

  const { width, height } = config;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${width}px;height:${height}px;border:none;opacity:0;pointer-events:none;`;
  iframe.sandbox.add("allow-same-origin", "allow-scripts");
  document.body.appendChild(iframe);

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rawCss = Array.from(doc.querySelectorAll("style"))
      .map((s) => s.textContent ?? "")
      .join("\n");
    const cleanedCss = rawCss.replace(/@import[^;]+;/gi, "");
    const body = doc.body?.innerHTML ?? html;

    const fullHtml = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  #poster-root {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    position: relative;
    font-family: 'Noto Kufi Arabic', sans-serif;
    direction: rtl;
    background: #ffffff;
  }
  ${cleanedCss}
</style></head><body style="margin:0;padding:0;"><div id="poster-root">${body}</div></body></html>`;

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = fullHtml;
    });

    const iframeDoc = iframe.contentDocument!;
    const node = iframeDoc.getElementById("poster-root")!;

    if ("fonts" in iframeDoc) {
      await (iframeDoc as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    const dataUrl = await toPng(node, {
      cacheBust: true,
      width,
      height,
      pixelRatio: 2,
      skipFonts: true,
    });

    const res = await fetch(dataUrl);
    return res.blob();
  } finally {
    document.body.removeChild(iframe);
  }
}

async function exportPoster(result: PosterResult): Promise<void> {
  let blob: Blob;
  if (result.imageBase64) {
    const res = await fetch(result.imageBase64);
    blob = await res.blob();
  } else {
    blob = await renderToBlob(result.html, result.format);
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `poster-${result.designNameAr || result.designIndex + 1}-${result.format}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Poster Card ───────────────────────────────────────────────────

function PosterCard({
  result,
  onSaveAsTemplate,
}: {
  result: PosterResult;
  onSaveAsTemplate?: (designIndex: number) => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const bodyHtml = useMemo(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.html, "text/html");
      const rawCss = Array.from(doc.querySelectorAll("style"))
        .map((style) => style.textContent ?? "")
        .join("\n");
      const cleanedCss = rawCss.replace(/@import[^;]+;/gi, "");
      const scopedCss = scopeCss(cleanedCss, ".poster-root");
      const body = doc.body?.innerHTML ?? result.html;
      const baseStyle = `
        .poster-root {
          width: 1080px;
          height: 1080px;
          overflow: hidden;
          position: relative;
          font-family: 'Noto Kufi Arabic', sans-serif;
          direction: rtl;
          background: #ffffff;
        }
        .poster-root * { box-sizing: border-box; }
      `;
      return `<style>${baseStyle}\n${scopedCss}</style><div id="poster-root" class="poster-root">${body}</div>`;
    } catch {
      return result.html;
    }
  }, [result.html]);

  function scopeCss(css: string, scope: string): string {
    if (!css) return css;
    let out = css;
    out = out.replace(/:root/g, scope);
    out = out.replace(/(^|[\\s,>+~])html(?=[\\s,>+~{])/g, `$1${scope}`);
    out = out.replace(/(^|[\\s,>+~])body(?=[\\s,>+~{])/g, `$1${scope}`);
    out = out.replace(/(^|[\\s,>+~])\\*(?=[\\s,>+~{])/g, `$1${scope} *`);
    return out;
  }

  const iframeSrcDoc = useMemo(() => {
    return `<!doctype html><html><head><meta charset="utf-8" />${bodyHtml}</head><body style="margin:0;padding:0;"> </body></html>`;
  }, [bodyHtml]);

  useEffect(() => {
    let cancelled = false;
    setIsRendering(true);
    setPreviewUrl(null);
    setIframeKey((k) => k + 1);

    const raf = requestAnimationFrame(() => {});
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [result.designIndex, result.html]);

  const handleIframeLoad = useCallback(() => {
    const renderAsync = async () => {
      try {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument;
        const node = doc?.getElementById("poster-root") as HTMLElement | null;
        if (!node) {
          setIsRendering(false);
          return;
        }
        if (doc && "fonts" in doc) {
          await (doc as Document & { fonts: FontFaceSet }).fonts.ready;
        }
        const dataUrl = await toPng(node, {
          cacheBust: true,
          width: 1080,
          height: 1080,
          pixelRatio: 1,
          skipFonts: true,
        });
        setPreviewUrl(dataUrl);
        setIsRendering(false);
      } catch (err) {
        console.error("[PosterCard] html-to-image failed", {
          designIndex: result.designIndex,
          message: err instanceof Error ? err.message : String(err),
        });
        setIsRendering(false);
      }
    };

    void renderAsync();
  }, [result.designIndex]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportPoster(result);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [result]);

  const handleShare = async () => {
    if (!("share" in navigator)) return;
    try {
      let blob: Blob;
      if (result.imageBase64) {
        const res = await fetch(result.imageBase64);
        blob = await res.blob();
      } else {
        blob = await renderToBlob(result.html, result.format);
      }
      const file = new File([blob], `poster-${result.format}.png`, {
        type: "image/png",
      });
      await navigator.share({ files: [file] });
    } catch {
      // User cancelled or share failed
    }
  };

  if (result.status === "error") {
    return (
      <div className="bg-card border border-danger/30 rounded-2xl overflow-hidden shadow-md">
        <div className="aspect-square bg-danger/5 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <XCircle size={32} className="text-danger" />
          <p className="text-sm text-danger font-medium">فشل التصميم</p>
          {result.error && (
            <p className="text-xs text-muted">{result.error}</p>
          )}
        </div>
        <div className="p-3 text-center">
          <span className="text-xs text-muted">
            تصميم {result.designIndex + 1}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow group">
      {/* Preview */}
      <div className="relative aspect-square overflow-hidden bg-white">
        {result.imageBase64 ? (
          /* AI-generated image — display directly */
          <img
            src={result.imageBase64}
            alt={result.designNameAr || `تصميم ${result.designIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          /* HTML design — render via iframe + html-to-image */
          <>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={iframeSrcDoc}
              onLoad={handleIframeLoad}
              sandbox="allow-same-origin allow-scripts"
              className="absolute top-0 left-0 w-[1080px] h-[1080px] border-0"
              style={{
                transform: "scale(0.333)",
                transformOrigin: "top left",
                opacity: previewUrl ? 0 : 1,
              }}
              title={`poster-preview-${result.designIndex}`}
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt={result.designNameAr || `تصميم ${result.designIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                {isRendering ? "جاري العرض..." : "تعذر عرض المعاينة"}
              </div>
            )}
          </>
        )}

        {/* Badge */}
        {result.imageBase64 ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold backdrop-blur-sm z-10 shadow-lg">
            <Sparkles size={12} />
            AI صورة
          </div>
        ) : (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 text-white text-xs flex items-center justify-center font-bold backdrop-blur-sm z-10">
            {result.designIndex + 1}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 z-[5]" />
      </div>

      {/* Footer */}
      <div className="p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80 truncate max-w-[50%]">
          {result.designNameAr || `تصميم ${result.designIndex + 1}`}
        </span>
        <div className="flex items-center gap-1.5">
          {onSaveAsTemplate && (
            <button
              type="button"
              onClick={() => onSaveAsTemplate(result.designIndex)}
              className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="حفظ كقالب"
            >
              <Save size={16} />
            </button>
          )}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
              title="مشاركة"
            >
              <Share2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-colors"
            title="تصدير PNG"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
