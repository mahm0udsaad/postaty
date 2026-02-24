import { AbsoluteFill, Audio, Sequence } from "remotion";
import type { AnimationSpec } from "./types/animation-spec";
import { AnimatedImage } from "./components/AnimatedImage";
import { AnimatedText } from "./components/AnimatedText";
import { AnimatedShape } from "./components/AnimatedShape";
import { GradientOverlay } from "./components/GradientOverlay";

export interface ReelCompositionProps {
  spec: AnimationSpec;
  sourceImageUrl: string;
  images?: { poster?: string; logo?: string; product?: string };
  audioUrl?: string;
}

export const ReelComposition: React.FC<ReelCompositionProps> = ({
  spec,
  sourceImageUrl,
  images,
  audioUrl,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: spec.backgroundColor }}>
      {audioUrl && <Audio src={audioUrl} volume={1} />}
      {spec.segments.map((segment) => (
        <Sequence
          key={segment.id}
          from={segment.startFrame}
          durationInFrames={segment.durationInFrames}
        >
          {segment.layers.map((layer, layerIndex) => {
            const key = `${segment.id}-layer-${layerIndex}`;

            switch (layer.type) {
              case "image":
                return (
                  <AnimatedImage
                    key={key}
                    layer={layer}
                    sourceImageUrl={sourceImageUrl}
                    images={images}
                    durationInFrames={segment.durationInFrames}
                  />
                );
              case "text":
                return (
                  <AnimatedText
                    key={key}
                    layer={layer}
                    durationInFrames={segment.durationInFrames}
                  />
                );
              case "shape":
                return (
                  <AnimatedShape
                    key={key}
                    layer={layer}
                    durationInFrames={segment.durationInFrames}
                  />
                );
              case "gradient-overlay":
                return (
                  <GradientOverlay
                    key={key}
                    layer={layer}
                    durationInFrames={segment.durationInFrames}
                  />
                );
              default:
                return null;
            }
          })}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
