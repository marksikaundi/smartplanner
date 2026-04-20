import { memo } from "react";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from "react-native-svg";

export type HugeiconsIconData = readonly (
  readonly [string, Record<string, string | number>]
)[];

type HugeiconsIconProps = {
  icon: HugeiconsIconData;
  size?: number;
  color?: string;
};

const ELEMENTS = {
  path: Path,
  rect: Rect,
  circle: Circle,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  g: G,
};

const mapAttrs = (attrs: Record<string, string | number>, color: string) => {
  const mapped: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (key === "key") {
      continue;
    }

    if ((key === "stroke" || key === "fill") && value === "currentColor") {
      mapped[key] = color;
      continue;
    }

    mapped[key] = value;
  }

  return mapped;
};

const HugeiconsIcon = memo(function HugeiconsIcon({
  icon,
  size = 20,
  color = "#2D2E3A",
}: HugeiconsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icon.map(([tag, attrs], index) => {
        const Element = ELEMENTS[tag as keyof typeof ELEMENTS];
        if (!Element) {
          return null;
        }
        return <Element key={`${tag}-${index}`} {...mapAttrs(attrs, color)} />;
      })}
    </Svg>
  );
});

export default HugeiconsIcon;
