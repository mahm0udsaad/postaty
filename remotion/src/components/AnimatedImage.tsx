import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import type { ImageLayer } from "../types/animation-spec";

interface AnimatedImageProps {
  layer: ImageLayer;
  sourceImageUrl: string;
  images?: { poster?: string; logo?: string; product?: string };
  durationInFrames: number;
}

function getEasing(
  easing: ImageLayer["easing"]
): ((t: number) => number) | undefined {
  switch (easing) {
    case "ease-in":
      return (t: number) => t * t;
    case "ease-out":
      return (t: number) => 1 - (1 - t) * (1 - t);
    case "ease-in-out":
      return (t: number) =>
        t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "spring":
      return (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
          ? 0
          : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      };
    default:
      return undefined;
  }
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  layer,
  sourceImageUrl,
  images,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // Resolve which image URL to use based on layer.sourceId
  const resolvedUrl = (() => {
    if (layer.sourceId && images) {
      const mapped = images[layer.sourceId];
      if (mapped) return mapped;
    }
    return images?.poster || sourceImageUrl;
  })();

  const isLogo = layer.sourceId === "logo";
  const isPoster = !layer.sourceId || layer.sourceId === "poster";

  const easingFn = getEasing(layer.easing);

  // Clamp scale to prevent content flying out of frame
  // Poster: very subtle (0.95-1.15) to keep all text/prices readable
  // Product: can be more dramatic (0.8-1.4)
  const scaleMin = isPoster ? 0.95 : 0.8;
  const scaleMax = isPoster ? 1.15 : 1.4;
  const safeStartScale = Math.max(scaleMin, Math.min(layer.startScale, scaleMax));
  const safeEndScale = Math.max(scaleMin, Math.min(layer.endScale, scaleMax));

  const scale = interpolate(frame, [0, durationInFrames], [safeStartScale, safeEndScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easingFn,
  });

  const opacity = interpolate(
    frame,
    [0, durationInFrames],
    [layer.opacity.start, layer.opacity.end],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Calculate pan offset — subtle for posters, more for product close-ups
  let translateX = 0;
  let translateY = 0;

  const panAmount = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easingFn,
  });

  const maxPan = isPoster ? 15 : 40;

  switch (layer.effect) {
    case "pan-left":
      translateX = interpolate(panAmount, [0, 1], [maxPan, -maxPan]);
      break;
    case "pan-right":
      translateX = interpolate(panAmount, [0, 1], [-maxPan, maxPan]);
      break;
    case "pan-up":
      translateY = interpolate(panAmount, [0, 1], [maxPan, -maxPan]);
      break;
    case "pan-down":
      translateY = interpolate(panAmount, [0, 1], [-maxPan, maxPan]);
      break;
  }

  // Position offset — keep posters centered, allow offset for product close-ups
  const posX = isPoster
    ? (Math.max(0.45, Math.min(layer.position.x, 0.55)) - 0.5) * 100
    : (layer.position.x - 0.5) * 100;
  const posY = isPoster
    ? (Math.max(0.45, Math.min(layer.position.y, 0.55)) - 0.5) * 100
    : (layer.position.y - 0.5) * 100;

  // Logo: contained, not stretched, moderate size
  if (isLogo) {
    return (
      <AbsoluteFill
        style={{
          opacity,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={resolvedUrl}
          style={{
            maxWidth: "60%",
            maxHeight: "30%",
            objectFit: "contain",
            transform: `translate(${posX + translateX}px, ${posY + translateY}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </AbsoluteFill>
    );
  }

  // Poster: "contain" so the FULL design is always visible
  // Background color fills letterbox areas. All text/prices/CTAs stay readable.
  if (isPoster) {
    return (
      <AbsoluteFill
        style={{
          opacity,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={resolvedUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translate(${posX + translateX}px, ${posY + translateY}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </AbsoluteFill>
    );
  }

  // Product/other: "cover" for dramatic fills and close-ups
  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow: "hidden",
      }}
    >
      <Img
        src={resolvedUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${posX + translateX}px, ${posY + translateY}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
    </AbsoluteFill>
  );
};
