/** sRGB colour, each channel 0–255. */
export type Rgb = readonly [number, number, number];

interface ColorStop {
  readonly meters: number;
  readonly color: Rgb;
}

/** Hypsometric tint tuned for a lowland region: most of the land lies between 80 and 250 m. */
const LAND_STOPS: readonly ColorStop[] = [
  { meters: 0, color: [100, 148, 96] },
  { meters: 100, color: [126, 168, 104] },
  { meters: 160, color: [162, 188, 118] },
  { meters: 220, color: [200, 204, 138] },
  { meters: 290, color: [216, 192, 134] },
  { meters: 380, color: [198, 162, 118] },
  { meters: 560, color: [168, 130, 98] },
];

const SEA_STOPS: readonly ColorStop[] = [
  { meters: -80, color: [44, 92, 134] },
  { meters: 0, color: [86, 138, 176] },
];

export function isSea(elevationMeters: number): boolean {
  return elevationMeters <= 0;
}

export function terrainColor(elevationMeters: number): Rgb {
  return interpolateStops(isSea(elevationMeters) ? SEA_STOPS : LAND_STOPS, elevationMeters);
}

function interpolateStops(stops: readonly ColorStop[], meters: number): Rgb {
  if (meters <= stops[0].meters) return stops[0].color;
  for (let i = 1; i < stops.length; i++) {
    const lower = stops[i - 1];
    const upper = stops[i];
    if (meters <= upper.meters) {
      const t = (meters - lower.meters) / (upper.meters - lower.meters);
      return [
        lower.color[0] + (upper.color[0] - lower.color[0]) * t,
        lower.color[1] + (upper.color[1] - lower.color[1]) * t,
        lower.color[2] + (upper.color[2] - lower.color[2]) * t,
      ];
    }
  }
  return stops[stops.length - 1].color;
}
