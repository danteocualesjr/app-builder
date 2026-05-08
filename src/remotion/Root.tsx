import { Composition } from "remotion"

import {
  RECAP_DURATION_FRAMES,
  RECAP_FPS,
  RECAP_HEIGHT,
  RECAP_WIDTH,
  recapSchema,
  WeeklyRecap,
} from "./WeeklyRecap"
import { RECAP_FALLBACK } from "./recap-data"

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WeeklyRecap"
        component={WeeklyRecap}
        durationInFrames={RECAP_DURATION_FRAMES}
        fps={RECAP_FPS}
        width={RECAP_WIDTH}
        height={RECAP_HEIGHT}
        schema={recapSchema}
        defaultProps={RECAP_FALLBACK}
      />
    </>
  )
}
