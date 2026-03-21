import mapData from "@/data/germany-bundeslaender-map.json";

/**
 * Germany federal states (Bundesländer) as SVG paths + centroids for animations.
 * GeoJSON source: https://github.com/isellsoap/deutschlandGeoJSON (2_bundeslaender/4_niedrig.geo.json)
 * Projected to SVG viewBox with equirectangular mapping for web display.
 */

export type GermanyLand = {
  id: string;
  name: string;
  path: string;
  cx: number;
  cy: number;
};

export const GERMANY_STATES_VIEWBOX = mapData.viewBox as string;
export const GERMANY_LANDS: GermanyLand[] = mapData.states as GermanyLand[];

function quadBetween(
  a: { cx: number; cy: number },
  b: { cx: number; cy: number },
  bend: number
): string {
  const mx = (a.cx + b.cx) / 2 + (b.cy - a.cy) * bend;
  const my = (a.cy + b.cy) / 2 - (b.cx - a.cx) * bend;
  return `M ${a.cx} ${a.cy} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${b.cx} ${b.cy}`;
}

/**
 * Routes visiting each Land centroid in radial order (loop), for “jumping” lines between states.
 */
export function germanyLandLoopRoutes(): { d: string; delay: string }[] {
  const vb = mapData.viewBox.split(/\s+/).map(Number);
  const vw = vb[2] ?? 520;
  const vh = vb[3] ?? 560;
  const gx = vw / 2;
  const gy = vh / 2;
  const ordered = [...GERMANY_LANDS].sort(
    (a, b) => Math.atan2(a.cy - gy, a.cx - gx) - Math.atan2(b.cy - gy, b.cx - gx)
  );
  const routes: { d: string; delay: string }[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const a = ordered[i];
    const b = ordered[(i + 1) % ordered.length];
    routes.push({
      d: quadBetween(a, b, 0.14),
      delay: `${(i * 0.22).toFixed(2)}s`,
    });
  }
  return routes;
}
