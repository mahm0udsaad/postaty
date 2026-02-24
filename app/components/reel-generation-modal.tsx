"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Loader2, AlertCircle, RefreshCw, Sparkles, Mic, MicOff, Volume2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import type { PosterResult } from "@/lib/types";
import { REEL_CONFIG, VOICE_PRESETS, VOICE_COUNTRIES } from "@/lib/constants";
import { ReelPlayer } from "./reel-player";

interface ReelGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterResult: PosterResult | null;
  generationId?: string;
  sourceImageUrl?: string;
  businessName?: string;
  productName?: string;
  category?: string;
  onCreditsChanged?: () => void;
  logoBase64?: string;
  logoUrl?: string;
  productImageBase64?: string;
  productImageUrl?: string;
}

type ReelModalStep =
  | "confirming"
  | "generating_spec"
  | "rendering"
  | "complete"
  | "error";

export function ReelGenerationModal({
  isOpen,
  onClose,
  posterResult,
  generationId,
  sourceImageUrl,
  businessName,
  productName,
  category,
  onCreditsChanged,
  logoBase64,
  logoUrl,
  productImageBase64,
  productImageUrl,
}: ReelGenerationModalProps) {
  const { t, locale } = useLocale();
  const [step, setStep] = useState<ReelModalStep>("confirming");
  const [reelId, setReelId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter voices by locale and selected country
  const availableVoices = useMemo(() => {
    let voices = VOICE_PRESETS.filter((v) => v.language === locale);
    if (selectedCountry !== "ALL") {
      voices = voices.filter((v) => v.country === selectedCountry);
    }
    return voices;
  }, [locale, selectedCountry]);

  // Get country options for the current locale
  const countryOptions = useMemo(() => {
    if (locale === "en") {
      return [{ code: "ALL", label: "All", labelEn: "All" }];
    }
    return VOICE_COUNTRIES;
  }, [locale]);

  // Stop audio playback
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  }, []);

  // Play voice preview
  const playPreview = useCallback(async (voiceId: string) => {
    // If same voice is playing, stop it
    if (playingVoiceId === voiceId) {
      stopPreview();
      return;
    }

    // Stop any currently playing audio
    stopPreview();
    setLoadingPreview(voiceId);

    try {
      const res = await fetch(`/api/voices/preview?voiceId=${voiceId}`);
      if (!res.ok) {
        setLoadingPreview(null);
        return;
      }
      const data = await res.json();
      if (!data.previewUrl) {
        setLoadingPreview(null);
        return;
      }

      const audio = new Audio(data.previewUrl);
      audio.volume = 0.7;
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };

      await audio.play();
      setPlayingVoiceId(voiceId);
    } catch {
      // Ignore playback errors
    } finally {
      setLoadingPreview(null);
    }
  }, [playingVoiceId, stopPreview]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("confirming");
      setReelId(null);
      setVideoUrl(null);
      setProgress(0);
      setError(null);
      setSelectedVoiceId(null);
      setSelectedCountry("ALL");
      stopPreview();
    }
  }, [isOpen, stopPreview]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Poll for render progress
  useEffect(() => {
    if (step !== "rendering" || !reelId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reels/${reelId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "complete" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setStep("complete");
          clearInterval(interval);
        } else if (data.status === "error") {
          setError(data.error || t("فشل في إنشاء الريلز", "Failed to create reel"));
          setStep("error");
          clearInterval(interval);
        } else {
          setProgress(data.progress || 0);
        }
      } catch {
        // Retry on next interval
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [step, reelId, t]);

  const handleConfirm = useCallback(async () => {
    if (!posterResult) return;
    stopPreview();

    setStep("generating_spec");
    setError(null);

    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId,
          sourceImageUrl: sourceImageUrl || "",
          sourceImageBase64: posterResult.imageBase64,
          logoUrl: logoUrl || undefined,
          logoBase64: logoBase64 || undefined,
          productUrl: productImageUrl || undefined,
          productBase64: productImageBase64 || undefined,
          businessName,
          productName,
          category,
          language: locale,
          voiceId: selectedVoiceId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "upgrade_required") {
          setError(t("يجب ترقية اشتراكك لاستخدام هذه الميزة", "You need to upgrade your plan to use this feature"));
          setStep("error");
          return;
        }
        if (data.error === "insufficient_credits") {
          setError(t("رصيدك غير كافٍ. تحتاج رصيدين على الأقل", "Insufficient credits. You need at least 2 credits"));
          setStep("error");
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      setReelId(data.reelId);
      onCreditsChanged?.();

      if (data.status === "rendering") {
        setStep("rendering");
      } else if (data.status === "error") {
        setError(data.error || t("فشل في إنشاء الريلز", "Failed to create reel"));
        setStep("error");
      }
    } catch (err: any) {
      setError(err.message || t("حدث خطأ غير متوقع", "An unexpected error occurred"));
      setStep("error");
    }
  }, [posterResult, generationId, sourceImageUrl, businessName, productName, category, locale, t, onCreditsChanged, logoBase64, logoUrl, productImageBase64, productImageUrl, selectedVoiceId, stopPreview]);

  const handleRetry = () => {
    setStep("confirming");
    setError(null);
    setReelId(null);
    setVideoUrl(null);
    setProgress(0);
  };

  if (!isOpen || !posterResult) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === "confirming" || step === "complete" || step === "error" ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg bg-surface-1 rounded-3xl shadow-2xl border border-card-border overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

              {/* Close button */}
              {(step === "confirming" || step === "complete" || step === "error") && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-2 text-muted transition-colors z-10"
                >
                  <X size={18} />
                </button>
              )}

              <div className="p-6 md:p-8">
                {/* ── Confirming ──────────────────────────────── */}
                {step === "confirming" && (
                  <div className="space-y-5">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Film size={24} className="text-purple-500" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {t("تحويل التصميم إلى ريلز", "Turn Design into Reel")}
                      </h3>
                      <p className="text-muted text-sm">
                        {t(
                          `سيتم خصم ${REEL_CONFIG.creditsPerReel} رصيد من حسابك`,
                          `This will use ${REEL_CONFIG.creditsPerReel} credits from your account`
                        )}
                      </p>
                    </div>

                    {/* Preview thumbnail */}
                    {(posterResult.imageBase64 || sourceImageUrl) && (
                      <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-card-border shadow-md">
                        <img
                          src={posterResult.imageBase64 || sourceImageUrl || ""}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white/90 rounded-full text-xs font-bold text-purple-600">
                          9:16
                        </div>
                      </div>
                    )}

                    {/* ── Voice Picker ──────────────────────────── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Mic size={16} className="text-purple-500" />
                        {t("تعليق صوتي", "Voiceover")}
                      </div>

                      {/* Country filter */}
                      {countryOptions.length > 1 && (
                        <div className="flex flex-wrap gap-1.5">
                          {countryOptions.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => setSelectedCountry(country.code)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                selectedCountry === country.code
                                  ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40"
                                  : "bg-surface-2/50 text-muted hover:bg-surface-2"
                              }`}
                            >
                              {locale === "ar" ? country.label : country.labelEn}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Voice chips */}
                      <div className="flex flex-wrap gap-2">
                        {/* No voice option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoiceId(null);
                            stopPreview();
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedVoiceId === null
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                              : "bg-surface-2 text-muted hover:bg-surface-2/80"
                          }`}
                        >
                          <MicOff size={14} />
                          {t("بدون صوت", "No Voice")}
                        </button>

                        {availableVoices.map((voice) => {
                          const isSelected = selectedVoiceId === voice.id;
                          const isPlaying = playingVoiceId === voice.id;
                          const isLoading = loadingPreview === voice.id;

                          return (
                            <div key={voice.id} className="flex items-center gap-0.5">
                              {/* Voice select button */}
                              <button
                                type="button"
                                onClick={() => setSelectedVoiceId(voice.id)}
                                className={`flex items-center gap-1.5 pl-3 pr-1.5 py-2 rounded-l-xl text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                                    : "bg-surface-2 text-muted hover:bg-surface-2/80"
                                }`}
                              >
                                {locale === "ar" ? voice.nameAr : voice.name}
                                <span className="text-[10px] opacity-70">
                                  {voice.gender === "male" ? t("ذكر", "M") : t("أنثى", "F")}
                                </span>
                              </button>
                              {/* Preview play button */}
                              <button
                                type="button"
                                onClick={() => playPreview(voice.id)}
                                className={`p-2 rounded-r-xl text-sm transition-all ${
                                  isSelected
                                    ? "bg-purple-700 text-white hover:bg-purple-800"
                                    : "bg-surface-2 text-muted hover:bg-surface-2/80"
                                } ${isPlaying ? "animate-pulse" : ""}`}
                                title={t("تشغيل عينة", "Play preview")}
                              >
                                {isLoading ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Volume2 size={13} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Accent label for selected voice */}
                      {selectedVoiceId && (() => {
                        const voice = VOICE_PRESETS.find((v) => v.id === selectedVoiceId);
                        return voice ? (
                          <p className="text-xs text-muted">
                            {locale === "ar" ? voice.accentAr : voice.accent} - {locale === "ar" ? voice.countryLabel : voice.countryLabelEn}
                            {" | "}
                            {t(
                              "سيتم إنشاء نص إعلاني تلقائياً بالذكاء الاصطناعي",
                              "AI will auto-generate an ad narration script"
                            )}
                          </p>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-surface-2 text-foreground rounded-xl font-medium hover:bg-surface-2/80 transition-colors"
                      >
                        {t("إلغاء", "Cancel")}
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-[0.98]"
                      >
                        {t("إنشاء ريلز", "Create Reel")}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Generating Spec ─────────────────────────── */}
                {step === "generating_spec" && (
                  <div className="py-8 space-y-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                    >
                      <Sparkles size={24} className="text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {selectedVoiceId
                          ? t("الذكاء الاصطناعي يصمم الرسوم المتحركة والتعليق الصوتي...", "AI is designing animation and voiceover...")
                          : t("الذكاء الاصطناعي يصمم الرسوم المتحركة...", "AI is designing the animation...")}
                      </h3>
                      <p className="text-muted text-sm">
                        {selectedVoiceId
                          ? t("يتم تحليل التصميم وإنشاء مخطط الحركة والصوت", "Analyzing your design, creating motion plan and narration")
                          : t("يتم تحليل التصميم وإنشاء مخطط الحركة", "Analyzing your design and creating motion plan")}
                      </p>
                    </div>
                    <Loader2 size={20} className="animate-spin mx-auto text-purple-500" />
                  </div>
                )}

                {/* ── Rendering ───────────────────────────────── */}
                {step === "rendering" && (
                  <div className="py-8 space-y-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Film size={24} className="text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {t("جاري إنشاء الفيديو...", "Rendering your reel...")}
                      </h3>
                      <p className="text-muted text-sm">
                        {t("قد يستغرق هذا من 30 إلى 90 ثانية", "This may take 30-90 seconds")}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs mx-auto">
                      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${Math.max(progress * 100, 5)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-muted mt-2">
                        {Math.round(progress * 100)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Complete ────────────────────────────────── */}
                {step === "complete" && videoUrl && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {t("الريلز جاهز!", "Your Reel is Ready!")}
                      </h3>
                      <p className="text-muted text-sm">
                        {t("يمكنك تحميله ونشره مباشرة", "Download and publish it right away")}
                      </p>
                    </div>
                    <ReelPlayer
                      videoUrl={videoUrl}
                      fileName={`reel-${posterResult.designNameAr || "design"}.mp4`}
                    />
                  </div>
                )}

                {/* ── Error ───────────────────────────────────── */}
                {step === "error" && (
                  <div className="py-8 space-y-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
                      <AlertCircle size={28} className="text-danger" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {t("حدث خطأ", "An error occurred")}
                      </h3>
                      {error && (
                        <p className="text-muted text-sm bg-danger/5 border border-danger/10 rounded-lg p-3 mt-2">
                          {error}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-surface-2 text-foreground rounded-xl font-medium hover:bg-surface-2/80 transition-colors"
                      >
                        {t("إغلاق", "Close")}
                      </button>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary-hover transition-colors"
                      >
                        <RefreshCw size={16} />
                        {t("إعادة المحاولة", "Try again")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
