import './BeatArc.css';

const ARC_WIDTH = 300;
const ARC_PADDING_X = 16;
const ARC_RADIUS = ARC_WIDTH / 2 - ARC_PADDING_X;
const ARC_HEIGHT = ARC_RADIUS + 28;
const ARC_CX = ARC_WIDTH / 2;
const ARC_CY = ARC_HEIGHT - 8;
const VIEWBOX_TOP = ARC_CY - ARC_RADIUS - 8;
const VIEWBOX_HEIGHT = ARC_HEIGHT - VIEWBOX_TOP;

function arcPoint(angle) {
  return {
    x: ARC_CX + ARC_RADIUS * Math.cos(angle),
    y: ARC_CY - ARC_RADIUS * Math.sin(angle),
  };
}

function indicatorAngle(beats, currentBeat, beatProgress, isPlaying) {
  if (!isPlaying) return Math.PI / 2;
  if (beats <= 1) return Math.PI / 2;
  const fractionalBeat = currentBeat + beatProgress;
  return Math.PI - (fractionalBeat / (beats - 1)) * Math.PI;
}

export default function BeatArc({
  beats,
  currentBeat,
  beatProgress,
  isPlaying,
}) {
  const angle = indicatorAngle(beats, currentBeat, beatProgress, isPlaying);
  const dot = arcPoint(angle);

  return (
    <svg
      className="beat-arc"
      viewBox={`0 ${VIEWBOX_TOP} ${ARC_WIDTH} ${VIEWBOX_HEIGHT}`}
      aria-hidden="true"
    >
      <path
        d={`M ${ARC_CX - ARC_RADIUS} ${ARC_CY} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${ARC_CX + ARC_RADIUS} ${ARC_CY}`}
        className="beat-arc-line"
        fill="none"
      />
      <circle
        className="beat-arc-dot"
        cx={dot.x}
        cy={dot.y}
        r={3.5}
      />
    </svg>
  );
}
