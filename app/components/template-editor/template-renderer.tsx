"use client";

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  type CSSProperties,
} from "react";
import { ImageIcon } from "lucide-react";
import { FORMAT_CONFIGS } from "@/lib/constants";
import type {
  TemplateLayer,
  OutputFormat,
  BackgroundProps,
  TextProps,
  ImageProps,
  ShapeProps,
  BadgeProps,
} from "@/lib/types";
import {
  resolveTextBinding,
  resolveImageBinding,
  type TemplateFormValues,
} from "@/lib/template-bindings";

interface TemplateRendererProps {
  layers: TemplateLayer[];
  values: TemplateFormValues;
  format: OutputFormat;
}

/**
 * Renders template layers using percentage-based positioning inside
 * a container with CSS aspect-ratio. Font sizes and border radii are
 * scaled proportionally to the container's actual width.
 *
 * The container ref is exposed for html2canvas capture — the download
 * button uses `scale: targetWidth / containerWidth` to produce a
 * full-resolution image.
 */
export const TemplateRenderer = forwardRef<HTMLDivElement, TemplateRendererProps>(
  function TemplateRenderer({ layers, values, format }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useImperativeHandle(ref, () => containerRef.current!);

    const config = FORMAT_CONFIGS[format];
    // Scale factor: how much smaller the preview is compared to full resolution
    const scale = containerWidth > 0 ? containerWidth / config.width : 0;

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width;
        if (w && w > 0) setContainerWidth(w);
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const sortedLayers = [...layers]
      .filter((l) => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          aspectRatio: `${config.width} / ${config.height}`,
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
        }}
      >
        {scale > 0 &&
          sortedLayers.map((layer) => (
            <LayerElement
              key={layer.id}
              layer={layer}
              values={values}
              scale={scale}
            />
          ))}
      </div>
    );
  }
);

// ── Individual layer renderer ──────────────────────────────────────

function LayerElement({
  layer,
  values,
  scale,
}: {
  layer: TemplateLayer;
  values: TemplateFormValues;
  scale: number;
}) {
  const base: CSSProperties = {
    position: "absolute",
    left: `${layer.x * 100}%`,
    top: `${layer.y * 100}%`,
    width: `${layer.width * 100}%`,
    height: `${layer.height * 100}%`,
    zIndex: layer.zIndex,
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
  };

  switch (layer.type) {
    case "background":
      return <BackgroundLayer style={base} props={layer.props as BackgroundProps} />;
    case "image":
    case "logo":
      return (
        <ImageLayer
          style={base}
          props={layer.props as ImageProps}
          values={values}
          scale={scale}
        />
      );
    case "text":
      return (
        <TextLayer
          style={base}
          props={layer.props as TextProps}
          values={values}
          scale={scale}
        />
      );
    case "shape":
      return <ShapeLayer style={base} props={layer.props as ShapeProps} scale={scale} />;
    case "badge":
      return (
        <BadgeLayer
          style={base}
          props={layer.props as BadgeProps}
          values={values}
          scale={scale}
        />
      );
    default:
      return null;
  }
}

// ── Background ─────────────────────────────────────────────────────

function BackgroundLayer({
  style,
  props,
}: {
  style: CSSProperties;
  props: BackgroundProps;
}) {
  return (
    <div
      style={{
        ...style,
        backgroundColor: props.fill,
        backgroundImage: props.gradient
          ? `linear-gradient(${props.gradient.angle}deg, ${props.gradient.from}, ${props.gradient.to})`
          : undefined,
      }}
    />
  );
}

// ── Image / Logo ───────────────────────────────────────────────────

function ImageLayer({
  style,
  props,
  values,
  scale,
}: {
  style: CSSProperties;
  props: ImageProps;
  values: TemplateFormValues;
  scale: number;
}) {
  const src = resolveImageBinding(props.binding, values);

  return (
    <div style={style}>
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: props.fit as CSSProperties["objectFit"],
            borderRadius: props.borderRadius * scale,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: props.borderRadius * scale,
            backgroundColor: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon size={Math.max(24, 48 * scale)} color="#94a3b8" />
        </div>
      )}
    </div>
  );
}

// ── Text ───────────────────────────────────────────────────────────

function TextLayer({
  style,
  props,
  values,
  scale,
}: {
  style: CSSProperties;
  props: TextProps;
  values: TemplateFormValues;
  scale: number;
}) {
  const resolved = resolveTextBinding(props.binding, values);
  const text = resolved || props.content;

  const justify =
    props.align === "center"
      ? "center"
      : props.align === "right"
        ? "flex-start"
        : "flex-end";

  return (
    <div
      style={{
        ...style,
        fontFamily: `"${props.fontFamily}", "Noto Kufi Arabic", sans-serif`,
        fontSize: props.fontSize * scale,
        fontWeight:
          props.fontWeight === "extrabold"
            ? 800
            : props.fontWeight === "bold"
              ? 700
              : 400,
        color: props.color,
        textAlign: props.align,
        direction: props.direction,
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        overflow: "hidden",
        lineHeight: 1.3,
        whiteSpace: props.maxLines === 1 ? "nowrap" : undefined,
        textOverflow: props.maxLines === 1 ? "ellipsis" : undefined,
        opacity: resolved ? 1 : 0.5,
      }}
    >
      {text}
    </div>
  );
}

// ── Shape ──────────────────────────────────────────────────────────

function ShapeLayer({
  style,
  props,
  scale,
}: {
  style: CSSProperties;
  props: ShapeProps;
  scale: number;
}) {
  return (
    <div
      style={{
        ...style,
        backgroundColor:
          props.fill === "transparent" ? "transparent" : props.fill,
        border: props.stroke
          ? `${(props.strokeWidth || 1) * scale}px solid ${props.stroke}`
          : undefined,
        borderRadius:
          props.shape === "circle"
            ? "50%"
            : props.shape === "rounded-rect"
              ? (props.borderRadius ?? 16) * scale
              : 0,
      }}
    />
  );
}

// ── Badge ──────────────────────────────────────────────────────────

function BadgeLayer({
  style,
  props,
  values,
  scale,
}: {
  style: CSSProperties;
  props: BadgeProps;
  values: TemplateFormValues;
  scale: number;
}) {
  const text = props.editable
    ? resolveTextBinding("cta", values) || props.text
    : props.text;

  return (
    <div
      style={{
        ...style,
        backgroundColor: props.backgroundColor,
        color: props.textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.min(32 * scale, 36),
        borderRadius: (props.style === "circle" ? "50%" : 12 * scale),
        fontFamily: `"Noto Kufi Arabic", sans-serif`,
        direction: "rtl",
      }}
    >
      {text}
    </div>
  );
}
