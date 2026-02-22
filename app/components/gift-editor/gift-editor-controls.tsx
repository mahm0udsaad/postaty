"use client";

import { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { GiftEditorState } from "@/lib/types";
import { OverlayUploadControl } from "./overlay-upload-control";
import { useLocale } from "@/hooks/use-locale";

type ActiveLayer = "text" | "overlay";

interface GiftEditorControlsProps {
  state: GiftEditorState;
  activeLayer: ActiveLayer;
  onActiveLayerChange: (layer: ActiveLayer) => void;
  selectedTextIndex: number;
  onSelectedTextIndexChange: (index: number) => void;
  selectedOverlayIndex: number;
  onSelectedOverlayIndexChange: (index: number) => void;
  onChange: (next: GiftEditorState) => void;
  onRemoveBackground: (base64: string, overlayIndex: number) => Promise<void>;
  removeBgLoading: boolean;
  removeBgMessage?: string;
}

function GiftEditorControlsImpl({
  state,
  activeLayer,
  onActiveLayerChange,
  selectedTextIndex,
  onSelectedTextIndexChange,
  selectedOverlayIndex,
  onSelectedOverlayIndexChange,
  onChange,
  onRemoveBackground,
  removeBgLoading,
  removeBgMessage,
}: GiftEditorControlsProps) {
  const { t } = useLocale();
  const activeTextIndex =
    selectedTextIndex >= 0 && selectedTextIndex < state.texts.length ? selectedTextIndex : 0;
  const activeText = state.texts[activeTextIndex];
  const activeOverlayIndex =
    selectedOverlayIndex >= 0 && selectedOverlayIndex < state.overlays.length
      ? selectedOverlayIndex
      : 0;
  const activeOverlay = state.overlays[activeOverlayIndex];

  const updateActiveText = (
    updater: (current: GiftEditorState["texts"][number]) => GiftEditorState["texts"][number]
  ) => {
    if (!activeText) return;
    const nextTexts = [...state.texts];
    nextTexts[activeTextIndex] = updater(nextTexts[activeTextIndex]);
    onChange({
      ...state,
      texts: nextTexts,
    });
  };

  const handleAddText = () => {
    const nextIndex = state.texts.length;
    onChange({
      ...state,
      texts: [
        ...state.texts,
        {
          content: "",
          color: "#ffffff",
          fontSize: 54,
          fontWeight: 700,
          fontFamily: "noto-kufi",
          x: 0.5,
          y: 0.2 + Math.min(nextIndex, 3) * 0.1,
        },
      ],
    });
    onActiveLayerChange("text");
    onSelectedTextIndexChange(nextIndex);
  };

  const handleRemoveActiveText = () => {
    if (state.texts.length <= 1) return;
    const nextTexts = state.texts.filter((_, index) => index !== activeTextIndex);
    onChange({
      ...state,
      texts: nextTexts,
    });
    onSelectedTextIndexChange(Math.max(0, activeTextIndex - 1));
  };

  const updateActiveOverlay = (
    updater: (current: GiftEditorState["overlays"][number]) => GiftEditorState["overlays"][number]
  ) => {
    if (!activeOverlay) return;
    const nextOverlays = [...state.overlays];
    nextOverlays[activeOverlayIndex] = updater(nextOverlays[activeOverlayIndex]);
    onChange({
      ...state,
      overlays: nextOverlays,
    });
  };

  const handleAddOverlay = () => {
    if (state.overlays.length >= 2) return;
    const nextIndex = state.overlays.length;
    onChange({
      ...state,
      overlays: [
        ...state.overlays,
        {
          imageBase64: null,
          x: 0.5,
          y: 0.6,
          scale: 0.65,
          borderRadius: 24,
        },
      ],
    });
    onActiveLayerChange("overlay");
    onSelectedOverlayIndexChange(nextIndex);
  };

  const handleRemoveActiveOverlayLayer = () => {
    if (state.overlays.length <= 1) return;
    const nextOverlays = state.overlays.filter((_, index) => index !== activeOverlayIndex);
    onChange({
      ...state,
      overlays: nextOverlays,
    });
    onSelectedOverlayIndexChange(Math.max(0, activeOverlayIndex - 1));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onActiveLayerChange("text")}
          className={`rounded-lg py-2 text-sm border ${
            activeLayer === "text"
              ? "border-primary text-primary bg-primary/10"
              : "border-card-border hover:bg-surface-2"
          }`}
        >
          {t("طبقة النص", "Text layer")}
        </button>
        <button
          type="button"
          onClick={() => onActiveLayerChange("overlay")}
          className={`rounded-lg py-2 text-sm border ${
            activeLayer === "overlay"
              ? "border-primary text-primary bg-primary/10"
              : "border-card-border hover:bg-surface-2"
          }`}
        >
          {t("طبقة الصورة", "Image layer")}
        </button>
      </div>

      <section className="space-y-3 p-3 rounded-xl bg-surface-2 border border-card-border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">{t("النص", "Text")}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddText}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-xs hover:bg-surface-1"
            >
              <Plus size={12} />
              {t("إضافة نص", "Add text")}
            </button>
            <button
              type="button"
              onClick={handleRemoveActiveText}
              disabled={state.texts.length <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-xs hover:bg-surface-1 disabled:opacity-50"
            >
              <Trash2 size={12} />
              {t("حذف", "Delete")}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.texts.map((text, index) => (
            <button
              key={`text-chip-${index}`}
              type="button"
              onClick={() => {
                onActiveLayerChange("text");
                onSelectedTextIndexChange(index);
              }}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeLayer === "text" && index === activeTextIndex
                  ? "border-primary text-primary bg-primary/10"
                  : "border-card-border hover:bg-surface-1"
              }`}
            >
              {t("نص", "Text")} {index + 1}
              {text.content.trim() ? `: ${text.content.slice(0, 10)}` : ""}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={activeText?.content ?? ""}
          onChange={(event) =>
            updateActiveText((current) => ({ ...current, content: event.target.value }))
          }
          placeholder={t("اكتب نص الهدية", "Enter gift text")}
          className="w-full rounded-lg border border-card-border px-3 py-2 bg-surface-1 text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted flex flex-col gap-1">
            {t("اللون", "Color")}
            <input
              type="color"
              value={activeText?.color ?? "#ffffff"}
              onChange={(event) =>
                updateActiveText((current) => ({ ...current, color: event.target.value }))
              }
              className="h-9 w-full rounded cursor-pointer bg-surface-1"
            />
          </label>

          <label className="text-xs text-muted flex flex-col gap-1">
            {t("الخط", "Font")}
            <select
              value={activeText?.fontFamily ?? "noto-kufi"}
              onChange={(event) =>
                updateActiveText((current) => ({
                  ...current,
                  fontFamily: event.target.value as GiftEditorState["texts"][number]["fontFamily"],
                }))
              }
              className="h-9 rounded border border-card-border px-2 bg-surface-1 text-sm"
            >
              <option value="noto-kufi">Noto Kufi Arabic</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted flex flex-col gap-1">
            {t("وزن الخط", "Font weight")}
            <select
              value={activeText?.fontWeight ?? 700}
              onChange={(event) =>
                updateActiveText((current) => ({
                  ...current,
                  fontWeight: Number(event.target.value) as GiftEditorState["texts"][number]["fontWeight"],
                }))
              }
              className="h-9 rounded border border-card-border px-2 bg-surface-1 text-sm"
            >
              <option value={400}>400</option>
              <option value={500}>500</option>
              <option value={600}>600</option>
              <option value={700}>700</option>
              <option value={800}>800</option>
            </select>
          </label>

          <label className="text-xs text-muted flex flex-col gap-1">
            {t("حجم الخط", "Font size")}
            <input
              type="range"
              min={20}
              max={120}
              value={activeText?.fontSize ?? 54}
              onChange={(event) =>
                updateActiveText((current) => ({ ...current, fontSize: Number(event.target.value) }))
              }
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => updateActiveText((current) => ({ ...current, x: 0.5, y: 0.2 }))}
          className="w-full rounded-lg border border-card-border py-2 text-sm hover:bg-surface-1"
        >
          {t("إعادة موضع النص", "Reset text position")}
        </button>
      </section>

      <section className="space-y-3 p-3 rounded-xl bg-surface-2 border border-card-border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">{t("الصورة المضافة", "Overlay image")}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddOverlay}
              disabled={state.overlays.length >= 2}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-xs hover:bg-surface-1 disabled:opacity-50"
            >
              <Plus size={12} />
              {t("إضافة صورة", "Add image")}
            </button>
            <button
              type="button"
              onClick={handleRemoveActiveOverlayLayer}
              disabled={state.overlays.length <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-xs hover:bg-surface-1 disabled:opacity-50"
            >
              <Trash2 size={12} />
              {t("حذف", "Delete")}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.overlays.map((overlay, index) => (
            <button
              key={`overlay-chip-${index}`}
              type="button"
              onClick={() => {
                onActiveLayerChange("overlay");
                onSelectedOverlayIndexChange(index);
              }}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeLayer === "overlay" && index === activeOverlayIndex
                  ? "border-primary text-primary bg-primary/10"
                  : "border-card-border hover:bg-surface-1"
              }`}
            >
              {t("صورة", "Image")} {index + 1}
              {overlay.imageBase64 ? ` • ${t("مضافة", "Added")}` : ""}
            </button>
          ))}
        </div>
        <OverlayUploadControl
          value={activeOverlay?.imageBase64 ?? null}
          onChange={(base64) => updateActiveOverlay((current) => ({ ...current, imageBase64: base64 }))}
          onRemoveBackground={(base64) => onRemoveBackground(base64, activeOverlayIndex)}
          removeBgLoading={removeBgLoading}
        />

        {activeOverlay?.imageBase64 && (
          <>
            <label className="text-xs text-muted flex flex-col gap-1">
              {t("الحجم", "Size")}
              <input
                type="range"
                min={0.2}
                max={1.4}
                step={0.01}
                value={activeOverlay.scale}
                onChange={(event) =>
                  updateActiveOverlay((current) => ({ ...current, scale: Number(event.target.value) }))
                }
              />
            </label>

            <label className="text-xs text-muted flex flex-col gap-1">
              {t("تدوير الزوايا", "Corner roundness")}
              <input
                type="range"
                min={0}
                max={120}
                value={activeOverlay.borderRadius}
                onChange={(event) =>
                  updateActiveOverlay((current) => ({ ...current, borderRadius: Number(event.target.value) }))
                }
              />
            </label>

            <button
              type="button"
              onClick={() => updateActiveOverlay((current) => ({ ...current, x: 0.5, y: 0.55 }))}
              className="w-full rounded-lg border border-card-border py-2 text-sm hover:bg-surface-1"
            >
              {t("إعادة موضع الصورة", "Reset image position")}
            </button>
          </>
        )}

        {removeBgMessage && <p className="text-xs text-muted">{removeBgMessage}</p>}
      </section>
    </div>
  );
}

export const GiftEditorControls = memo(GiftEditorControlsImpl);
