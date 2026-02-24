import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { TextLayer } from "../types/animation-spec";

interface AnimatedTextProps {
  layer: TextLayer;
  durationInFrames: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  layer,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const delayedFrame = Math.max(0, frame - layer.entranceDelay);

  // Entrance animation (first 15 frames after delay)
  const entranceDuration = 15;
  let entranceOpacity = 1;
  let entranceTranslateX = 0;
  let entranceTranslateY = 0;
  let entranceScale = 1;

  switch (layer.entrance) {
    case "fade-up":
      entranceOpacity = interpolate(delayedFrame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      entranceTranslateY = interpolate(delayedFrame, [0, entranceDuration], [40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "fade-down":
      entranceOpacity = interpolate(delayedFrame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      entranceTranslateY = interpolate(delayedFrame, [0, entranceDuration], [-40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "fade-left":
      entranceOpacity = interpolate(delayedFrame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      entranceTranslateX = interpolate(delayedFrame, [0, entranceDuration], [60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "fade-right":
      entranceOpacity = interpolate(delayedFrame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      entranceTranslateX = interpolate(delayedFrame, [0, entranceDuration], [-60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "scale-in":
      entranceOpacity = interpolate(delayedFrame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      entranceScale = interpolate(delayedFrame, [0, entranceDuration], [0.5, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "typewriter":
      entranceOpacity = interpolate(delayedFrame, [0, 5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "none":
      break;
  }

  // Exit animation (last 10 frames)
  const exitStart = durationInFrames - 10;
  let exitOpacity = 1;
  let exitScale = 1;

  if (frame >= exitStart) {
    switch (layer.exit) {
      case "fade-out":
        exitOpacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        break;
      case "scale-out":
        exitScale = interpolate(frame, [exitStart, durationInFrames], [1, 0.8], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        exitOpacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        break;
      case "none":
        break;
    }
  }

  // Typewriter: reveal characters over time
  const visibleChars =
    layer.entrance === "typewriter"
      ? Math.floor(
          interpolate(delayedFrame, [0, entranceDuration * 2], [0, layer.content.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        )
      : layer.content.length;

  const displayText = layer.content.slice(0, visibleChars);

  const textAlign = layer.alignment;
  const shadow = layer.shadow
    ? `${layer.shadow.x}px ${layer.shadow.y}px ${layer.shadow.blur}px ${layer.shadow.color}`
    : undefined;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
        padding: "0 60px",
        top: `${layer.position.y * 100}%`,
        left: 0,
        right: 0,
        height: "auto",
        position: "absolute",
        transform: `translateY(-50%)`,
      }}
    >
      <div
        style={{
          fontFamily: layer.fontFamily,
          fontSize: layer.fontSize,
          fontWeight: layer.fontWeight,
          color: layer.color,
          textAlign,
          textShadow: shadow,
          opacity: entranceOpacity * exitOpacity,
          transform: `translate(${entranceTranslateX}px, ${entranceTranslateY}px) scale(${entranceScale * exitScale})`,
          direction: layer.fontFamily === "Noto Kufi Arabic" || layer.fontFamily === "Tajawal" ? "rtl" : "ltr",
          lineHeight: 1.3,
          maxWidth: "100%",
          wordBreak: "break-word",
        }}
      >
        {displayText}
      </div>
    </AbsoluteFill>
  );
};
