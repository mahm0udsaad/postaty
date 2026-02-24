// ── Animation Spec Types ─────────────────────────────────────────
// These types define the JSON schema that the AI generates.
// Our fixed Remotion compositions interpret this data — no AI code is executed.

export interface AnimationSpec {
  durationInFrames: number; // 30fps * seconds (typically 240-300)
  fps: 30;
  width: 1080;
  height: 1920;
  backgroundColor: string; // hex color
  segments: Segment[];
  voiceover?: {
    script: string;
    language: "ar" | "en";
  };
}

export interface Segment {
  id: string;
  startFrame: number;
  durationInFrames: number;
  layers: Layer[];
}

export type Layer =
  | ImageLayer
  | TextLayer
  | ShapeLayer
  | GradientOverlayLayer;

export interface ImageLayer {
  type: "image";
  sourceId?: "poster" | "logo" | "product"; // which source image to render (default: poster)
  effect:
    | "ken-burns-in"
    | "ken-burns-out"
    | "zoom-in"
    | "zoom-out"
    | "pan-left"
    | "pan-right"
    | "pan-up"
    | "pan-down"
    | "fade-in"
    | "static";
  startScale: number; // 0.5-3.0
  endScale: number;
  position: { x: number; y: number }; // 0-1 normalized
  opacity: { start: number; end: number }; // 0-1
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring";
}

export interface TextLayer {
  type: "text";
  content: string;
  fontFamily: "Noto Kufi Arabic" | "Inter" | "Tajawal";
  fontSize: number; // 24-120
  fontWeight: 400 | 600 | 700 | 800;
  color: string; // hex
  position: { x: number; y: number }; // 0-1 normalized
  alignment: "center" | "right" | "left";
  entrance:
    | "fade-up"
    | "fade-down"
    | "fade-left"
    | "fade-right"
    | "scale-in"
    | "typewriter"
    | "none";
  exit: "fade-out" | "scale-out" | "none";
  entranceDelay: number; // frames (0-30)
  shadow?: { color: string; blur: number; x: number; y: number };
}

export interface ShapeLayer {
  type: "shape";
  shape: "circle" | "rectangle" | "line";
  color: string; // hex
  position: { x: number; y: number }; // 0-1 normalized
  size: { width: number; height: number }; // pixels
  opacity: { start: number; end: number };
  entrance: "scale-in" | "fade-in" | "draw" | "none";
  borderRadius?: number;
}

export interface GradientOverlayLayer {
  type: "gradient-overlay";
  colors: string[]; // hex colors
  direction: "top" | "bottom" | "left" | "right";
  opacity: { start: number; end: number };
}
