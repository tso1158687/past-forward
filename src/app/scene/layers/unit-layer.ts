import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { KeyedLabel, KeyedLabelLayer } from './keyed-label-layer';

/** A unit to draw right now. The scene is told where units are; it never works that out itself. */
export interface UnitMarker {
  readonly id: string;
  readonly label: string;
  readonly location: GeographicLocation;
  /** True when the location is an in-between estimate rather than a stated position. */
  readonly interpolated: boolean;
}

export function createUnitLayer(surface: TerrainSurface): KeyedLabelLayer {
  return new KeyedLabelLayer(surface, { className: 'unit-marker' });
}

export function unitLabels(markers: readonly UnitMarker[]): KeyedLabel[] {
  return markers.map((marker) => ({
    id: marker.id,
    text: marker.label,
    location: marker.location,
    data: { basis: marker.interpolated ? 'interpolated' : 'anchor' },
  }));
}
