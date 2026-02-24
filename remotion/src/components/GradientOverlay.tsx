import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { GradientOverlayLayer } from "../types/animation-spec";

interface GradientOverlayProps {
  layer: GradientOverlayLayer;
  durationInFrames: number;
}

const DIRECTION_MAP: Record<GradientOverlayLayer["direction"], string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

export const GradientOverlay: React.FC<GradientOverlayProps> = ({
  layer,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, durationInFrames],
    [layer.opacity.start, layer.opacity.end],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const direction = DIRECTION_MAP[layer.direction] || "to bottom";
  const colorStops = layer.colors.join(", ");

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${direction}, ${colorStops})`,
        opacity,
      }}
    />
  );
};
