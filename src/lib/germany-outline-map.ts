/**
 * Germany country outline in SVG viewBox space (520×560).
 * Source geometry: simplified administrative boundary from world.geo.json (DEU),
 * https://github.com/johan/world.geo.json — projected equirectangular to SVG coords.
 * Licensed as public domain / open data (verify upstream for your compliance needs).
 */

export const GERMANY_MAP_VIEWBOX = "0 0 520 560";

/** Single closed path — geographic shape of Germany (simplified). */
export const GERMANY_OUTLINE_PATH =
  "M228.09 12L229.06 38.97L284.57 55.23L283.99 80L339.85 66.89L370.73 47.78L432.76 75.34L458.7 97.56L471.54 133.07L456.22 151.7L476.17 176.57L489.76 213.9L485.48 237.96L508 282.52L483.48 289.8L468.99 281.78L455.22 295.07L415.77 308.58L395.37 325.97L355.44 341.16L365.06 361.91L370.88 391.34L398.91 408.11L429.93 438.11L410.56 470.28L390.82 479.15L398.61 524.61L393.49 536.47L376.36 522.19L350.02 520.04L310.74 532.56L262.29 529.58L254.47 548L226.67 528.62L210.08 532.47L151.21 511.13L139.93 526.29L93.2 525.8L100.18 476.08L127.95 428.3L48.79 415.44L22.86 397.17L25.96 366.57L14.99 350.81L21.23 303.66L12 230.53L45 230.51L58.93 204.24L72.62 140.34L62.35 116.74L73.08 101.97L119 98.17L129.19 113.56L166.49 79.16L153.93 53L151.41 13.42L192.93 22.62L228.09 12Z";

/** Major hubs approximated from city coordinates, same projection as outline. */
export const GERMANY_HUBS = [
  { key: "hamburg", cx: 231.83, cy: 112.01 },
  { key: "berlin", cx: 419.44, cy: 183.89 },
  { key: "munich", cx: 319.18, cy: 489.55 },
  { key: "stuttgart", cx: 187.33, cy: 444.89 },
  { key: "frankfurt", cx: 159.86, cy: 352.07 },
  { key: "cologne", cx: 65.36, cy: 294.15 },
] as const;

function quadBetween(
  a: { cx: number; cy: number },
  b: { cx: number; cy: number },
  bend: number
): string {
  const mx = (a.cx + b.cx) / 2 + (b.cy - a.cy) * bend;
  const my = (a.cy + b.cy) / 2 - (b.cx - a.cx) * bend;
  return `M ${a.cx} ${a.cy} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${b.cx} ${b.cy}`;
}

/** Animated routes: loop through hubs (intra-Germany flows). */
export function germanyHubRoutes(): { d: string; delay: string }[] {
  const hubs = [...GERMANY_HUBS, GERMANY_HUBS[0]];
  const routes: { d: string; delay: string }[] = [];
  for (let i = 0; i < hubs.length - 1; i++) {
    routes.push({
      d: quadBetween(hubs[i], hubs[i + 1], 0.12),
      delay: `${(i * 0.35).toFixed(2)}s`,
    });
  }
  return routes;
}
