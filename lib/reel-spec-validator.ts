import { z } from "zod";
import type { AnimationSpec } from "@/remotion/src/types/animation-spec";

// ── Helpers ──────────────────────────────────────────────────────
// Use `.catch(defaultValue)` on enum and numeric fields so that
// unexpected AI-generated values fall back to safe defaults instead
// of throwing a ZodError and killing the whole generation.

// ── Layer Schemas ────────────────────────────────────────────────

const positionSchema = z.object({
  x: z.number().min(0).max(1).catch(0.5),
  y: z.number().min(0).max(1).catch(0.5),
});

const opacitySchema = z.object({
  start: z.number().min(0).max(1).catch(1),
  end: z.number().min(0).max(1).catch(1),
});

const imageLayerSchema = z.object({
  type: z.literal("image"),
  sourceId: z.enum(["poster", "logo", "product"]).optional().catch(undefined),
  effect: z.enum([
    "ken-burns-in", "ken-burns-out", "zoom-in", "zoom-out",
    "pan-left", "pan-right", "pan-up", "pan-down",
    "fade-in", "static",
  ]).catch("zoom-in"),
  startScale: z.number().min(0.5).max(3).catch(1),
  endScale: z.number().min(0.5).max(3).catch(1.2),
  position: positionSchema,
  opacity: opacitySchema,
  easing: z.enum(["linear", "ease-in", "ease-out", "ease-in-out", "spring"]).catch("ease-out"),
});

const shadowSchema = z.object({
  color: z.string().catch("rgba(0,0,0,0.5)"),
  blur: z.number().min(0).max(50).catch(4),
  x: z.number().min(-20).max(20).catch(0),
  y: z.number().min(-20).max(20).catch(2),
}).optional();

const textLayerSchema = z.object({
  type: z.literal("text"),
  content: z.string().min(1).max(200),
  fontFamily: z.enum(["Noto Kufi Arabic", "Inter", "Tajawal"]).catch("Noto Kufi Arabic"),
  fontSize: z.number().min(16).max(200).catch(48),
  fontWeight: z.union([
    z.literal(400), z.literal(600), z.literal(700), z.literal(800),
  ]).catch(700),
  color: z.string().catch("#FFFFFF"),
  position: positionSchema,
  alignment: z.enum(["center", "right", "left"]).catch("center"),
  entrance: z.enum([
    "fade-up", "fade-down", "fade-left", "fade-right",
    "scale-in", "typewriter", "none",
  ]).catch("fade-up"),
  exit: z.enum(["fade-out", "scale-out", "none"]).catch("fade-out"),
  entranceDelay: z.number().min(0).max(60).catch(0),
  shadow: shadowSchema,
});

const shapeLayerSchema = z.object({
  type: z.literal("shape"),
  shape: z.enum(["circle", "rectangle", "line"]).catch("rectangle"),
  color: z.string().catch("#FFFFFF"),
  position: positionSchema,
  size: z.object({
    width: z.number().min(1).max(2000).catch(200),
    height: z.number().min(1).max(4000).catch(200),
  }),
  opacity: opacitySchema,
  entrance: z.enum(["scale-in", "fade-in", "draw", "none"]).catch("fade-in"),
  borderRadius: z.number().min(0).max(1000).optional(),
});

const gradientOverlayLayerSchema = z.object({
  type: z.literal("gradient-overlay"),
  colors: z.array(z.string()).min(2).max(4),
  direction: z.enum(["top", "bottom", "left", "right"]).catch("bottom"),
  opacity: opacitySchema,
});

const layerSchema = z.discriminatedUnion("type", [
  imageLayerSchema,
  textLayerSchema,
  shapeLayerSchema,
  gradientOverlayLayerSchema,
]);

// ── Segment & Spec Schemas ───────────────────────────────────────

const segmentSchema = z.object({
  id: z.string().min(1).max(50),
  startFrame: z.number().int().min(0),
  durationInFrames: z.number().int().min(1).max(450),
  layers: z.array(layerSchema).min(1).max(20),
});

const voiceoverSchema = z.object({
  script: z.string().min(1).max(500),
  language: z.enum(["ar", "en"]).catch("ar"),
}).optional().catch(undefined);

export const animationSpecSchema = z.object({
  durationInFrames: z.number().int().min(150).max(450),
  fps: z.literal(30),
  width: z.literal(1080),
  height: z.literal(1920),
  backgroundColor: z.string(),
  segments: z.array(segmentSchema).min(1).max(8),
  voiceover: voiceoverSchema,
});

// ── Validation Function ──────────────────────────────────────────

export function validateAndSanitizeSpec(raw: unknown): AnimationSpec {
  return animationSpecSchema.parse(raw) as AnimationSpec;
}

/**
 * Attempt to parse JSON from AI response text.
 * Handles cases where AI wraps JSON in markdown code fences.
 */
export function extractJsonFromResponse(text: string): unknown {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    cleaned = cleaned.slice(firstNewline + 1);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3).trim();
    }
  }

  return JSON.parse(cleaned);
}
