import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { ShapeLayer } from "../types/animation-spec";

interface AnimatedShapeProps {
  layer: ShapeLayer;
  durationInFrames: number;
}

export const AnimatedShape: React.FC<AnimatedShapeProps> = ({
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

  // Entrance animations
  const entranceDuration = 20;
  let scale = 1;
  let entranceOpacity = 1;
  let drawProgress = 1;

  switch (layer.entrance) {
    case "scale-in":
      scale = interpolate(frame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "fade-in":
      entranceOpacity = interpolate(frame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "draw":
      drawProgress = interpolate(frame, [0, entranceDuration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "none":
      break;
  }

  const posX = layer.position.x * 1080;
  const posY = layer.position.y * 1920;

  const shapeStyle: React.CSSProperties = {
    position: "absolute",
    left: posX - layer.size.width / 2,
    top: posY - layer.size.height / 2,
    width: layer.size.width,
    height: layer.size.height,
    opacity: opacity * entranceOpacity,
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  };

  if (layer.shape === "line") {
    return (
      <div
        style={{
          ...shapeStyle,
          height: 2,
          backgroundColor: layer.color,
          width: layer.size.width * drawProgress,
        }}
      />
    );
  }

  if (layer.shape === "circle") {
    return (
      <div
        style={{
          ...shapeStyle,
          borderRadius: "50%",
          backgroundColor: layer.color,
        }}
      />
    );
  }

  // rectangle
  return (
    <div
      style={{
        ...shapeStyle,
        borderRadius: layer.borderRadius ?? 0,
        backgroundColor: layer.color,
      }}
    />
  );
};
