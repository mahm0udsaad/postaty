"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { GiftEditorState } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

type ActiveLayer = "text" | "overlay";

interface GiftEditorCanvasProps {
  baseImageBase64: string;
  state: GiftEditorState;
  activeLayer: ActiveLayer;
  onActiveLayerChange: (layer: ActiveLayer) => void;
  selectedTextIndex: number;
  onSelectedTextIndexChange: (index: number) => void;
  selectedOverlayIndex: number;
  onSelectedOverlayIndexChange: (index: number) => void;
  onChange: (next: GiftEditorState) => void;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function GiftEditorCanvasImpl({
  baseImageBase64,
  state,
  activeLayer,
  onActiveLayerChange,
  selectedTextIndex,
  onSelectedTextIndexChange,
  selectedOverlayIndex,
  onSelectedOverlayIndexChange,
  onChange,
}: GiftEditorCanvasProps) {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragLayerRef = useRef<{ layer: ActiveLayer; textIndex?: number; overlayIndex?: number } | null>(null);
  const [overlayRatios, setOverlayRatios] = useState<Record<number, number>>({});
  const activeTextIndex =
    selectedTextIndex >= 0 && selectedTextIndex < state.texts.length ? selectedTextIndex : 0;
  const activeOverlayIndex =
    selectedOverlayIndex >= 0 && selectedOverlayIndex < state.overlays.length ? selectedOverlayIndex : 0;
  const overlayImageSources = useMemo(
    () => state.overlays.map((overlay) => overlay.imageBase64 ?? ""),
    [state.overlays]
  );

  useEffect(() => {
    const activeSources = overlayImageSources
      .map((src, index) => ({ src, index }))
      .filter((entry) => Boolean(entry.src));

    if (activeSources.length === 0) {
      return;
    }

    let cancelled = false;
    const ratioPromises = activeSources.map(
      (entry) =>
        new Promise<{ index: number; ratio: number }>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              resolve({ index: entry.index, ratio: img.naturalHeight / img.naturalWidth });
              return;
            }
            resolve({ index: entry.index, ratio: 1 });
          };
          img.onerror = () => resolve({ index: entry.index, ratio: 1 });
          img.src = entry.src;
        })
    );

    void Promise.all(ratioPromises).then((results) => {
      if (cancelled) return;
      setOverlayRatios((prev) => {
        const next: Record<number, number> = {};
        for (const result of results) {
          next[result.index] = result.ratio;
        }
        const prevEntries = Object.entries(prev);
        if (prevEntries.length !== results.length) return next;
        for (const [key, value] of prevEntries) {
          if (next[Number(key)] !== value) return next;
        }
        return prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [overlayImageSources]);

  const updatePosition = (event: PointerEvent | React.PointerEvent<HTMLDivElement>) => {
    const el = canvasRef.current;
    const dragTarget = dragLayerRef.current;
    if (!el || !dragTarget) return;

    const rect = el.getBoundingClientRect();
    const x = clamp01((event.clientX - rect.left) / rect.width);
    const y = clamp01((event.clientY - rect.top) / rect.height);

    if (dragTarget.layer === "text") {
      const textIndex = dragTarget.textIndex ?? activeTextIndex;
      if (textIndex < 0 || textIndex >= state.texts.length) return;
      const nextTexts = [...state.texts];
      nextTexts[textIndex] = {
        ...nextTexts[textIndex],
        x,
        y,
      };
      onChange({
        ...state,
        texts: nextTexts,
      });
      return;
    }

    const overlayIndex = dragTarget.overlayIndex ?? activeOverlayIndex;
    if (overlayIndex < 0 || overlayIndex >= state.overlays.length) return;
    const nextOverlays = [...state.overlays];
    nextOverlays[overlayIndex] = {
      ...nextOverlays[overlayIndex],
      x,
      y,
    };
    onChange({
      ...state,
      overlays: nextOverlays,
    });
  };

  const onTextPointerDown = (
    index: number,
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragLayerRef.current = { layer: "text", textIndex: index };
    onActiveLayerChange("text");
    onSelectedTextIndexChange(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onOverlayPointerDown = (
    index: number,
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragLayerRef.current = { layer: "overlay", overlayIndex: index };
    onActiveLayerChange("overlay");
    onSelectedOverlayIndexChange(index);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePosition(event);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragLayerRef.current) return;
    updatePosition(event);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragLayerRef.current) return;
    dragLayerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="w-full">
      <div
        ref={canvasRef}
        className="relative w-full aspect-square rounded-2xl overflow-hidden border border-card-border bg-surface-2 touch-none"
      >
        <img src={baseImageBase64} alt="Gift base" className="w-full h-full object-cover" />

        {state.overlays.map((overlay, index) => {
          if (!overlay.imageBase64) return null;
          const overlaySize = `${Math.max(18, overlay.scale * 50)}%`;
          const ratio = overlayRatios[index] ?? 1;
          return (
            <div
              key={`gift-overlay-${index}`}
              onPointerDown={(event) => onOverlayPointerDown(index, event)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                left: `${overlay.x * 100}%`,
                top: `${overlay.y * 100}%`,
                width: overlaySize,
                aspectRatio: `${1 / ratio}`,
                borderRadius: overlay.borderRadius,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden cursor-grab active:cursor-grabbing border-2 ${
                activeLayer === "overlay" && index === activeOverlayIndex
                  ? "border-primary"
                  : "border-white/60"
              }`}
            >
              <img src={overlay.imageBase64} alt={`Overlay ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          );
        })}

        {state.texts.map((text, index) => (
          <div
            key={`gift-text-${index}`}
            onPointerDown={(event) => onTextPointerDown(index, event)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              left: `${text.x * 100}%`,
              top: `${text.y * 100}%`,
              color: text.color,
              fontSize: text.fontSize,
              fontWeight: text.fontWeight,
              fontFamily: '"Noto Kufi Arabic", sans-serif',
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-lg max-w-[80%] text-center cursor-grab active:cursor-grabbing whitespace-nowrap overflow-hidden text-ellipsis ${
              activeLayer === "text" && index === activeTextIndex
                ? "ring-2 ring-primary bg-black/25"
                : "bg-black/20"
            }`}
          >
            {text.content || t("اكتب النص هنا", "Write text here")}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">{t("اسحب النص أو الصورة داخل المعاينة لتحديد المكان.", "Drag text or image inside the preview to position it.")}</p>
    </div>
  );
}

export const GiftEditorCanvas = memo(GiftEditorCanvasImpl);
