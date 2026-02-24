import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import type { AnimationSpec } from "./types/animation-spec";

const defaultSpec: AnimationSpec = {
  durationInFrames: 270,
  fps: 30,
  width: 1080,
  height: 1920,
  backgroundColor: "#000000",
  segments: [],
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ReelComposition as unknown as React.FC<Record<string, unknown>>}
      durationInFrames={270}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        spec: defaultSpec,
        sourceImageUrl: "",
        images: {},
        audioUrl: "",
      }}
      calculateMetadata={({ props }: { props: Record<string, unknown> }) => {
        const spec = props.spec as AnimationSpec | undefined;
        return {
          durationInFrames: spec?.durationInFrames || 270,
          fps: 30,
          width: 1080,
          height: 1920,
        };
      }}
    />
  );
};
