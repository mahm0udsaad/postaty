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
  Send,
  Undo2,
  Maximize,
  Coins,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { removeOverlayBackground } from "@/app/actions-v2";
import { editDesignAction } from "@/app/actions-edit";
import { renderEditedGiftToBlob } from "@/lib/gift-editor/export-edited-gift";
import type { GiftEditorState, PosterResult, OutputFormat } from "@/lib/types";
import { FORMAT_CONFIGS, POSTER_GENERATION_FORMATS } from "@/lib/constants";
import { useLocale } from "@/hooks/use-locale";

const FORMAT_LABELS: Record<OutputFormat, { ar: string; en: string }> = {
  "instagram-square": { ar: "انستجرام بوست", en: "Instagram Post" },
  "instagram-story":  { ar: "انستجرام ستوري", en: "Instagram Story" },
  "facebook-post":    { ar: "فيسبوك بوست", en: "Facebook Post" },
  "facebook-cover":   { ar: "غلاف فيسبوك", en: "Facebook Cover" },
  "twitter-post":     { ar: "تويتر / X", en: "X / Twitter" },
  "whatsapp-status":  { ar: "حالة واتساب", en: "WhatsApp Status" },
};

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
  generationType?: "poster" | "menu";
  onCreditConsumed?: () => void;
  onEditComplete?: (newImageBase64: string, publicUrl?: string) => void;
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
  generationType = "poster",
  onCreditConsumed,
  onEditComplete,
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

  // AI Edit state
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [displayImage, setDisplayImage] = useState<string | undefined>(undefined);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [isViewingOriginal, setIsViewingOriginal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(result?.format ?? "instagram-square");
  const [previousFormat, setPreviousFormat] = useState<OutputFormat | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const prevOpenRef = useRef(false);
  useEffect(() => { setMounted(true); }, []);

  const { isSignedIn } = useAuth();
  const { data: creditState } = useSWR(
    isSignedIn ? "/api/billing" : null,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  );

  const isGift = GIFT_EDITOR_ENABLED && Boolean(result?.isGift);
  const defaultGiftLabel = useMemo(
    () => (locale === "ar" ? "هدية مجانية" : "Free gift"),
    [locale]
  );

  const fileName = useMemo(() => {
    const name = result?.designNameAr || (result ? `${result.designIndex + 1}` : "poster");
    return `poster-${name}-${selectedFormat}.jpg`;
  }, [result, selectedFormat]);

  // Only reset state when the modal transitions from closed → open.
  // This prevents edits (which update result.imageBase64 via onEditComplete)
  // from wiping out previousImage / displayImage mid-session.
  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }
    // Already open — skip reset (result may have changed due to onEditComplete)
    if (prevOpenRef.current) return;
    prevOpenRef.current = true;

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
    // Reset AI edit state
    setEditPrompt("");
    setIsEditing(false);
    setDisplayImage(result?.imageBase64);
    setPreviousImage(null);
    setIsViewingOriginal(false);
    setEditError(null);
    setEditHistory([]);
    setSelectedFormat(result?.format ?? "instagram-square");
    setPreviousFormat(null);
    setIsResizing(false);
  }, [result, isOpen, defaultGiftLabel]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !result || !mounted) return null;

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

  const currentImage = (isViewingOriginal && previousImage) ? previousImage : (displayImage || result.imageBase64);

  const getExportBlob = async (): Promise<Blob | null> => {
    if (!currentImage) return null;
    if (isGift && tab === "edit" && result.imageBase64) {
      return renderEditedGiftToBlob(result.imageBase64, editorState);
    }
    return base64ToBlob(currentImage);
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

  const handleEditDesign = async () => {
    if (!editPrompt.trim() || !currentImage || isEditing) return;
    setIsEditing(true);
    setEditError(null);

    const format: OutputFormat | "menu" = generationType === "menu" ? "menu" : result.format;

    try {
      // Pass generationId so upload+DB update happens server-side (no extra round-trip)
      const editResult = await editDesignAction(currentImage, editPrompt.trim(), format, "edit", generationId);

      if (editResult.status === "complete") {
        setPreviousImage(currentImage);
        setDisplayImage(editResult.imageBase64);
        setEditHistory((prev) => [...prev, editPrompt.trim()]);
        setEditPrompt("");
        onEditComplete?.(editResult.imageBase64, editResult.publicUrl);

        // Consume credit (fire-and-forget, don't block UI)
        const idempotencyKey = `edit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        fetch("/api/billing/consume-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idempotencyKey, amount: 0.5 }),
        })
          .catch((err) => console.error("[handleEditDesign] credit error", err))
          .finally(() => onCreditConsumed?.());
      } else {
        setEditError(editResult.error);
      }
    } catch (err) {
      console.error("[handleEditDesign] failed", err);
      setEditError(t("حدث خطأ أثناء التعديل. حاول مرة أخرى.", "An error occurred during editing. Please try again."));
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndoEdit = () => {
    if (!previousImage) return;
    setDisplayImage(previousImage);
    setPreviousImage(null);
    if (previousFormat) {
      setSelectedFormat(previousFormat);
      setPreviousFormat(null);
    }
    setIsViewingOriginal(false);
  };

  const handleFormatChange = async (fmt: OutputFormat) => {
    if (fmt === selectedFormat || isResizing || !currentImage) return;
    setIsResizing(true);
    try {
      const cfg = FORMAT_CONFIGS[fmt];
      const label = FORMAT_LABELS[fmt];
      const reframePrompt = locale === "ar"
        ? `أعد تأطير التصميم لتنسيق ${cfg.aspectRatio}. حافظ على كل المحتوى والألوان.`
        : `Reframe this design to ${cfg.aspectRatio} ratio. Keep all content, text, and colors.`;

      // Pass generationId so upload+DB update happens server-side (no extra round-trip)
      const editResult = await editDesignAction(currentImage, reframePrompt, fmt, "edit", generationId);
      if (editResult.status === "complete") {
        setPreviousImage(currentImage);
        setPreviousFormat(selectedFormat);
        setDisplayImage(editResult.imageBase64);
        setSelectedFormat(fmt);
        onEditComplete?.(editResult.imageBase64, editResult.publicUrl);

        // Consume credit (fire-and-forget, don't block UI)
        const idempotencyKey = `reframe_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        fetch("/api/billing/consume-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idempotencyKey, amount: 0.5 }),
        })
          .catch((err) => console.error("[handleFormatChange] credit error", err))
          .finally(() => onCreditConsumed?.());
      }
    } catch (err) {
      console.error("[handleFormatChange] failed", err);
    } finally {
      setIsResizing(false);
    }
  };

  return createPortal(
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
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 py-4">
                  <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                    <motion.div
                      layoutId={`poster-img-${result.designIndex}`}
                      className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden z-10 flex shrink-0 group"
                    >
                      {currentImage ? (
                        <>
                          <img
                            src={currentImage}
                            alt="Full Preview"
                            style={{ maxHeight: '100%' }}
                            className={`max-w-full w-auto object-contain transition-opacity duration-500 ${isEditing || isResizing ? "opacity-0" : "opacity-100"}`}
                          />
                          {!isEditing && !isResizing && previousImage && (
                            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md backdrop-blur-sm ${isViewingOriginal ? "bg-black/60 text-white/90" : "bg-primary text-white"}`}>
                              {isViewingOriginal ? t("قبل", "Before") : t("بعد", "After")}
                            </div>
                          )}
                          {!isEditing && !isResizing && (
                            <button
                              onClick={() => setIsFullscreen(true)}
                              className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-105 active:scale-95"
                              title={t("تكبير الصورة", "Fullscreen")}
                            >
                              <Maximize size={18} />
                            </button>
                          )}
                          {(isEditing || isResizing) && (
                            <div className="absolute inset-0 bg-surface-2 overflow-hidden">
                              <div
                                className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110 transition-transform duration-1000"
                                style={{ backgroundImage: `url(${currentImage})` }}
                              />
                              <motion.div
                                className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_20px_5px_rgba(var(--primary),0.6)] z-20"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                              />
                              <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                                <div className="relative flex items-center gap-3 px-6 py-4 bg-background/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10">
                                  <Loader2 size={24} className="animate-spin text-primary" />
                                  <div className="flex flex-col">
                                    <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                                      {isResizing
                                        ? t("جاري تغيير الأبعاد بواسطة Postaty AI...", "Resizing with Postaty AI...")
                                        : t("جاري التعديل بواسطة Postaty AI...", "Editing with Postaty AI...")}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {t("قد يستغرق هذا بضع ثوانٍ", "This may take a few seconds")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-surface-3 text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Floating AI Edit Input */}
                  {isSignedIn && currentImage && (
                    <div className="w-full max-w-xl px-4 z-50 shrink-0 transition-all duration-300 transform translate-y-0 opacity-100">
                      <div className="bg-background/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-2.5 flex flex-col gap-2 relative overflow-hidden">
                        
                        {isEditing && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                        )}

                        <div className="flex items-center justify-between px-2">
                          <div className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 flex-wrap">
                            <WandSparkles size={14} className="text-primary animate-pulse" />
                            <span>{t("تعديل بواسطة Postaty AI", "Edit with Postaty AI")}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold border border-primary/20">
                              ({t("التعديل يستهلك 0.5 رصيد", "Edit costs 0.5 credits")})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20 shrink-0">
                              <Coins size={11} />
                              <span>{creditState?.totalRemaining ?? "—"}</span>
                            </div>
                            {editError && (
                              <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-full">
                                {editError}
                              </span>
                            )}
                            {previousImage && !isEditing && (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center bg-surface-2 rounded-lg p-0.5 border border-card-border/50 text-[11px] font-bold">
                                  <button
                                    onClick={() => setIsViewingOriginal(false)}
                                    className={`px-2 py-1 rounded-md transition-all ${!isViewingOriginal ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"}`}
                                  >
                                    {t("بعد", "After")}
                                  </button>
                                  <button
                                    onClick={() => setIsViewingOriginal(true)}
                                    className={`px-2 py-1 rounded-md transition-all ${isViewingOriginal ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
                                  >
                                    {t("قبل", "Before")}
                                  </button>
                                </div>
                                <button
                                  onClick={handleUndoEdit}
                                  className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-foreground transition-colors bg-surface-2 hover:bg-surface-3 px-2 py-1 rounded-md border border-card-border/50"
                                >
                                  <Undo2 size={12} />
                                  {t("تراجع", "Undo")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {editHistory.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-1">
                            {editHistory.map((prompt, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-surface-2/80 px-2 py-0.5 rounded-full border border-card-border/50 max-w-[200px] truncate"
                              >
                                <span className="text-[9px] text-primary font-bold shrink-0">{i + 1}</span>
                                {prompt}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 relative z-10 items-end">
                          <textarea
                            ref={editInputRef}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleEditDesign();
                              }
                            }}
                            placeholder={t("مثال: غيّر لون الخلفية إلى أزرق...", "e.g. Change the background color to blue...")}
                            disabled={isEditing}
                            rows={1}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                            className="flex-1 bg-surface-2/50 hover:bg-surface-2 focus:bg-surface-2 border border-transparent focus:border-primary/30 text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50 text-foreground placeholder:text-muted-foreground/70"
                          />
                          <button
                            onClick={handleEditDesign}
                            disabled={isEditing || !editPrompt.trim()}
                            className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 h-[44px] w-[44px] flex items-center justify-center shrink-0"
                          >
                            {isEditing ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Send size={18} className={locale === 'ar' ? "rotate-180" : ""} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                      <div className="font-bold text-foreground">
                        {result.designNameAr || t("بدون عنوان", "Untitled")}
                        <span className="text-primary"> | Postaty AI</span>
                      </div>
                    </div>

                    <div className="p-4 bg-surface-2 rounded-2xl border border-card-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-muted">{t("الأبعاد", "Dimensions")}</div>
                        {isResizing
                          ? <Loader2 size={13} className="animate-spin text-primary" />
                          : <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold border border-primary/20">0.5 {t("رصيد", "credit")}</span>
                        }
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {POSTER_GENERATION_FORMATS.map((fmt) => {
                          const cfg = FORMAT_CONFIGS[fmt];
                          const label = FORMAT_LABELS[fmt];
                          const isSelected = selectedFormat === fmt;
                          return (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => handleFormatChange(fmt)}
                              disabled={isResizing}
                              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all disabled:opacity-50 ${
                                isSelected
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-card-border hover:border-primary/30 hover:bg-surface-1"
                              }`}
                            >
                              <span className={`text-[11px] font-bold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                                {locale === "ar" ? label.ar : label.en}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">{cfg.width}×{cfg.height}</span>
                            </button>
                          );
                        })}
                      </div>
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
                  <span>{isGift && tab === "edit" ? t("تحميل النسخة المعدلة", "Download edited version") : previousImage ? t("تحميل النسخة المعدلة", "Download edited version") : t("تحميل الصورة", "Download image")}</span>
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

      {/* Fullscreen Image Modal */}
      {isFullscreen && currentImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all duration-200"
          >
            <X size={24} />
          </button>
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={currentImage}
            alt="Fullscreen Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
