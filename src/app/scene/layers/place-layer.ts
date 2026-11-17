import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { KeyedLabel, KeyedLabelLayer } from './keyed-label-layer';

/** A place to point out on the map, such as where the selected event happened. */
export interface PlaceMarker {
  readonly id: string;
  readonly label: string;
  readonly location: GeographicLocation;
}

/**
 * Highlighted places are drawn as a ring on the location with the name above it, so they do not
 * cover the city label that may sit at the same spot.
 */
export function createPlaceLayer(surface: TerrainSurface): KeyedLabelLayer {
  return new KeyedLabelLayer(surface, { className: 'place-marker', anchor: [0.5, 1] });
}

export function placeLabels(markers: readonly PlaceMarker[]): KeyedLabel[] {
  return markers.map((marker) => ({
    id: marker.id,
    text: marker.label,
    location: marker.location,
  }));
}
