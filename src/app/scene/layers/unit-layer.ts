import { GeographicLocation } from '../../core/geo/geo-types';
import { Faction } from '../../core/history/scenario';
import { TerrainSurface } from '../terrain/terrain-surface';
import { KeyedLabel, KeyedLabelLayer } from './keyed-label-layer';

/** A unit to draw right now. The scene is told where units are; it never works that out itself. */
export interface UnitMarker {
  readonly id: string;
  readonly label: string;
  readonly location: GeographicLocation;
  /** Decides the emblem and colour of the marker. */
  readonly faction: Faction;
  /**
   * How the location was obtained: `stated` by a source, `estimated` from a source that gives
   * only a rough area, or `interpolated` between two stated positions.
   */
  readonly basis: 'stated' | 'estimated' | 'interpolated';
  readonly selected: boolean;
}

export function createUnitLayer(
  surface: TerrainSurface,
  onSelect: (unitId: string) => void,
): KeyedLabelLayer {
  return new KeyedLabelLayer(surface, { className: 'unit-marker', onSelect });
}

export function unitLabels(markers: readonly UnitMarker[]): KeyedLabel[] {
  return markers.map((marker) => ({
    id: marker.id,
    text: marker.label,
    location: marker.location,
    data: { faction: marker.faction, basis: marker.basis, selected: String(marker.selected) },
  }));
}
