"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Share2,
  Save,
  Loader2,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  WandSparkles,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { removeOverlayBackground } from "@/app/actions-v2";
import { renderEditedGiftToBlob } from "@/lib/gift-editor/export-edited-gift";
import type { GiftEditorState, PosterResult } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

const GiftEditorCanvas = dynamic(
  () => import("./gift-editor/gift-editor-canvas").then((mod) => mod.GiftEditorCanvas),
  { ssr: false }
);

const GiftEditorControls = dynamic(
  () => import("./gift-editor/gift-editor-controls").then((mod) => mod.GiftEditorControls),
  { ssr: false }
);

interface PosterModalProps {
  result: PosterResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAsTemplate?: (designIndex: number) => void;
  category?: string;
  model?: string;
  generationId?: string;
  imageStorageId?: string;
}

type ModalTab = "preview" | "edit";
type ActiveLayer = "text" | "overlay";

function defaultEditorState(defaultText: string): GiftEditorState {
  return {
    texts: [
      {
        content: defaultText,
        color: "#ffffff",
        fontSize: 54,
        fontWeight: 800,
        fontFamily: "noto-kufi",
        x: 0.5,
        y: 0.12,
      },
    ],
    overlays: [
      {
        imageBase64: null,
        x: 0.5,
        y: 0.58,
        scale: 0.75,
        borderRadius: 24,
      },
    ],
  };
}

function base64ToBlob(dataUrl: string): Blob {
  const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const mimeType = dataUrl.includes(",")
    ? dataUrl.split(",")[0].split(":")[1].split(";")[0]
    : "image/png";

  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i += 1) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Hidden behind feature flag — gift editor code is preserved but not reachable
const GIFT_EDITOR_ENABLED = false;

export function PosterModal({
  result,
  isOpen,
  onClose,
  onSaveAsTemplate,
  category,
  model,
  generationId,
  imageStorageId,
}: PosterModalProps) {
  const { locale, t } = useLocale();
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackState, setFeedbackState] = useState<"idle" | "like" | "dislike" | "submitted">("idle");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [tab, setTab] = useState<ModalTab>("preview");
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("text");
  const [selectedTextIndex, setSelectedTextIndex] = useState(0);
  const [selectedOverlayIndex, setSelectedOverlayIndex] = useState(0);
  const [editorState, setEditorState] = useState<GiftEditorState>(() => defaultEditorState(t("هدية مجانية", "Free gift")));
  const [removeBgLoading, setRemoveBgLoading] = useState(false);
  const [removeBgMessage, setRemoveBgMessage] = useState<string>();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent">("idle");

  const { isSignedIn } = useAuth();

  const isGift = GIFT_EDITOR_ENABLED && Boolean(result?.isGift);
  const defaultGiftLabel = useMemo(
    () => (locale === "ar" ? "هدية مجانية" : "Free gift"),
    [locale]
  );

  const fileName = useMemo(() => {
    const name = result?.designNameAr || (result ? `${result.designIndex + 1}` : "poster");
    const format = result?.format || "image";
    return `poster-${name}-${format}.png`;
  }, [result]);

  useEffect(() => {
    setIsExporting(false);
    setFeedbackState("idle");
    setShowCommentBox(false);
    setFeedbackComment("");
    setTab("preview");
    setActiveLayer("text");
    setSelectedTextIndex(0);
    setSelectedOverlayIndex(0);
    setEditorState(defaultEditorState(defaultGiftLabel));
    setRemoveBgLoading(false);
    setRemoveBgMessage(undefined);
    setShowReportForm(false);
    setReportMessage("");
    setReportState("idle");
  }, [result, isOpen, defaultGiftLabel]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const handleRemoveBackground = async (overlayBase64: string, overlayIndex: number) => {
    setRemoveBgLoading(true);
    setRemoveBgMessage(undefined);
    try {
      const output = await removeOverlayBackground(overlayBase64);
      setEditorState((prev) => ({
        ...prev,
        overlays: prev.overlays.map((overlay, index) =>
          index === overlayIndex
            ? {
                ...overlay,
                imageBase64: output.imageBase64,
              }
            : overlay
        ),
      }));
      setRemoveBgMessage(output.warning ?? t("تمت إزالة الخلفية بنجاح.", "Background removed successfully."));
    } catch (error) {
      console.error("Remove background failed", error);
      setRemoveBgMessage(t("تعذر إزالة الخلفية الآن، حاول مرة أخرى.", "Couldn't remove background now, please try again."));
    } finally {
      setRemoveBgLoading(false);
    }
  };

  const getExportBlob = async (): Promise<Blob | null> => {
    if (!result.imageBase64) return null;
    if (isGift && tab === "edit") {
      return renderEditedGiftToBlob(result.imageBase64, editorState);
    }
    return base64ToBlob(result.imageBase64);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await getExportBlob();
      if (!blob) return;
      downloadBlob(blob, fileName);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!("share" in navigator)) return;
    try {
      const blob = await getExportBlob();
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/png" });
      await navigator.share({ files: [file] });
    } catch {
      // user cancelled
    }
  };

  const handleFeedbackClick = (rating: "like" | "dislike") => {
    setFeedbackState(rating);
    setShowCommentBox(true);
  };

  const handleSubmitFeedback = async () => {
    if (feedbackState !== "like" && feedbackState !== "dislike") return;
    setIsSendingFeedback(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackState,
          comment: feedbackComment.trim() || undefined,
          model: model || undefined,
          category: category as
            | "restaurant"
            | "supermarket"
            | "ecommerce"
            | "services"
            | "fashion"
            | "beauty"
            | undefined,
          generationId: generationId || undefined,
          imageStorageId: imageStorageId || undefined,
        }),
      });
      setFeedbackState("submitted");
      setShowCommentBox(false);
    } catch (error) {
      console.error("Feedback submission failed:", error);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) return;
    setReportState("sending");
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "شكوى على تصميم",
          message: reportMessage.trim(),
          priority: "medium",
          metadata: {
            generationId: generationId || undefined,
            imageStoragePath: imageStorageId || undefined,
            category: category || undefined,
          },
        }),
      });
      setReportState("sent");
    } catch (error) {
      console.error("Report submission failed:", error);
      setReportState("idle");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl h-full max-h-[90vh] bg-surface-1 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 p-2 bg-black/20 text-white rounded-full backdrop-blur-md md:hidden"
            >
              <X size={20} />
            </button>

            <div className="flex-1 bg-surface-2 relative flex items-center justify-center p-4 md:p-8 overflow-auto">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {isGift && tab === "edit" && result.imageBase64 ? (
                <div className="relative w-full max-w-[680px] z-10">
                  <GiftEditorCanvas
                    baseImageBase64={result.imageBase64}
                    state={editorState}
                    activeLayer={activeLayer}
                    onActiveLayerChange={setActiveLayer}
                    selectedTextIndex={selectedTextIndex}
                    onSelectedTextIndexChange={setSelectedTextIndex}
                    selectedOverlayIndex={selectedOverlayIndex}
                    onSelectedOverlayIndexChange={setSelectedOverlayIndex}
                    onChange={setEditorState}
                  />
                </div>
              ) : (
                <motion.div
                  layoutId={`poster-img-${result.designIndex}`}
                  className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden z-10"
                >
                  {result.imageBase64 ? (
                    <img
                      src={result.imageBase64}
                      alt="Full Preview"
                      className="max-h-[calc(90vh-4rem)] md:max-h-[80vh] w-auto object-contain"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-surface-3 text-muted-foreground">
                      No Image
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="w-full md:w-[360px] bg-surface-1 border-l border-card-border p-6 flex flex-col gap-5 z-20 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {isGift ? t("تفاصيل وتحرير الهدية", "Gift details and editing") : t("تفاصيل التصميم", "Design details")}
                </h2>
                <button
                  onClick={onClose}
                  className="hidden md:flex p-2 hover:bg-surface-2 rounded-full text-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {isGift && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTab("preview")}
                    className={`rounded-lg py-2 border text-sm font-medium ${
                      tab === "preview"
                        ? "border-primary text-primary bg-primary/10"
                        : "border-card-border hover:bg-surface-2"
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("edit")}
                    className={`rounded-lg py-2 border text-sm font-medium flex items-center justify-center gap-1.5 ${
                      tab === "edit"
                        ? "border-primary text-primary bg-primary/10"
                        : "border-card-border hover:bg-surface-2"
                    }`}
                  >
                    <WandSparkles size={14} />
                    {t("تعديل الهدية", "Edit gift")}
                  </button>
                </div>
              )}

              <div className="space-y-4 flex-1">
                {isGift && tab === "edit" ? (
                  <GiftEditorControls
                    state={editorState}
                    activeLayer={activeLayer}
                    onActiveLayerChange={setActiveLayer}
                    selectedTextIndex={selectedTextIndex}
                    onSelectedTextIndexChange={setSelectedTextIndex}
                    selectedOverlayIndex={selectedOverlayIndex}
                    onSelectedOverlayIndexChange={setSelectedOverlayIndex}
                    onChange={setEditorState}
                    onRemoveBackground={handleRemoveBackground}
                    removeBgLoading={removeBgLoading}
                    removeBgMessage={removeBgMessage}
                  />
                ) : (
                  <>
                    <div className="p-4 bg-surface-2 rounded-2xl border border-card-border space-y-3">
                      <div className="text-sm font-medium text-muted">{t("العنوان المقترح", "Suggested title")}</div>
                      <div className="font-bold text-foreground">{result.designNameAr || t("بدون عنوان", "Untitled")}</div>
                    </div>

                    <div className="p-4 bg-surface-2 rounded-2xl border border-card-border space-y-3">
                      <div className="text-sm font-medium text-muted">{t("التنسيق", "Format")}</div>
                      <div className="font-bold text-foreground uppercase">{result.format}</div>
                    </div>

                    {isSignedIn && (
                      <div className="p-4 bg-surface-2 rounded-2xl border border-card-border space-y-3">
                        <div className="text-sm font-medium text-muted">{t("قيّم التصميم", "Rate this design")}</div>
                        {feedbackState === "submitted" ? (
                          <div className="flex items-center gap-2 text-success text-sm font-medium">
                            <CheckCircle2 size={16} />
                            <span>{t("شكراً لتقييمك!", "Thanks for your feedback!")}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFeedbackClick("like")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                  feedbackState === "like"
                                    ? "bg-success/20 text-success border border-success/30"
                                    : "bg-surface-1 border border-card-border text-muted hover:text-success hover:border-success/30"
                                }`}
                              >
                                <ThumbsUp size={16} />
                                <span>{t("إعجاب", "Like")}</span>
                              </button>
                              <button
                                onClick={() => handleFeedbackClick("dislike")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                  feedbackState === "dislike"
                                    ? "bg-destructive/20 text-destructive border border-destructive/30"
                                    : "bg-surface-1 border border-card-border text-muted hover:text-destructive hover:border-destructive/30"
                                }`}
                              >
                                <ThumbsDown size={16} />
                                <span>{t("عدم إعجاب", "Dislike")}</span>
                              </button>
                            </div>
                            {showCommentBox && (
                              <div className="space-y-2">
                                <textarea
                                  value={feedbackComment}
                                  onChange={(event) => setFeedbackComment(event.target.value)}
                                  placeholder={t("أخبرنا بالمزيد (اختياري)...", "Tell us more (optional)...")}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-surface-1 border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <button
                                  onClick={handleSubmitFeedback}
                                  disabled={isSendingFeedback}
                                  className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                                >
                                  {isSendingFeedback ? (
                                    <Loader2 size={14} className="animate-spin mx-auto" />
                                  ) : (
                                    t("إرسال التقييم", "Submit feedback")
                                  )}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Report a problem */}
                    {reportState === "sent" ? (
                      <div className="p-4 bg-success/10 border border-success/20 rounded-2xl">
                        <div className="flex items-center gap-2 text-success text-sm font-medium">
                          <CheckCircle2 size={16} />
                          <span>{t("تم إرسال البلاغ بنجاح!", "Report submitted successfully!")}</span>
                        </div>
                      </div>
                    ) : showReportForm ? (
                      <div className="p-4 bg-surface-2 rounded-2xl border border-destructive/20 space-y-3">
                        <div className="text-sm font-medium text-destructive flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          {t("الإبلاغ عن مشكلة في التصميم", "Report a problem with this design")}
                        </div>
                        <textarea
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          placeholder={t("صف المشكلة في التصميم...", "Describe the issue with this design...")}
                          rows={2}
                          className="w-full px-3 py-2 bg-surface-1 border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSubmitReport}
                            disabled={reportState === "sending" || !reportMessage.trim()}
                            className="flex-1 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                          >
                            {reportState === "sending" ? (
                              <Loader2 size={14} className="animate-spin mx-auto" />
                            ) : (
                              t("إرسال البلاغ", "Submit report")
                            )}
                          </button>
                          <button
                            onClick={() => { setShowReportForm(false); setReportMessage(""); }}
                            className="px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
                          >
                            {t("إلغاء", "Cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReportForm(true)}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-destructive transition-colors"
                      >
                        <AlertTriangle size={12} />
                        <span>{t("الإبلاغ عن مشكلة", "Report a problem")}</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3 mt-auto">
                {/* Reel generation button temporarily disabled */}
                {/* {onTurnIntoReel && !isGift && (
                  <button
                    onClick={() => { onTurnIntoReel(result); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-95"
                  >
                    <Film size={20} />
                    <span>{t("تحويل إلى ريلز", "Turn into Reel")}</span>
                  </button>
                )} */}

                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  <span>{isGift && tab === "edit" ? t("تحميل النسخة المعدلة", "Download edited version") : t("تحميل الصورة", "Download image")}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 bg-surface-1 border border-card-border hover:bg-surface-2 text-foreground rounded-xl font-semibold transition-all active:scale-95"
                    >
                      <Share2 size={18} />
                      <span>{t("مشاركة", "Share")}</span>
                    </button>
                  )}

                  {onSaveAsTemplate && (
                    <button
                      onClick={() => onSaveAsTemplate(result.designIndex)}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all active:scale-95 col-span-1"
                    >
                      <Save size={18} />
                      <span>{t("حفظ", "Save")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
