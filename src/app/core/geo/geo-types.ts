/** A point on the Earth's surface in WGS84 degrees. All map and history data is stored in this form. */
export interface GeographicLocation {
  readonly lon: number;
  readonly lat: number;
}

/** A rectangle in longitude/latitude degrees. */
export interface GeoBounds {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

export function boundsCenter(bounds: GeoBounds): GeographicLocation {
  return { lon: (bounds.west + bounds.east) / 2, lat: (bounds.south + bounds.north) / 2 };
}
