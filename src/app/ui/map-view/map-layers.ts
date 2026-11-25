import type { SituationView } from '../../scene/layers/situation-layer';
import type { UnitTrail } from '../../scene/layers/unit-layer';

/** The overlays a reader can switch off when the map gets crowded. */
export interface MapLayers {
  /** The evening's front, the area reached behind it and the Soviet pockets. */
  readonly front: boolean;
  /** The German arrows of the evening. */
  readonly arrows: boolean;
  /** Where each unit has been; the selected unit's trail stays even when this is off. */
  readonly trails: boolean;
}

export type MapLayer = keyof MapLayers;

export const ALL_MAP_LAYERS: MapLayers = { front: true, arrows: true, trails: true };

/** The evening's situation with the switched-off overlays left out. */
export function situationWithLayers(
  view: SituationView | undefined,
  layers: MapLayers,
): SituationView | undefined {
  if (!view || (layers.front && layers.arrows)) return view;
  return {
    ...view,
    ...(layers.front ? {} : { front: [], reach: [], pockets: [] }),
    ...(layers.arrows ? {} : { arrows: [] }),
  };
}

/** The trails to draw: all of them, or with trails off only the selected unit's. */
export function trailsWithLayers(
  trails: readonly UnitTrail[],
  layers: MapLayers,
  selectedUnitId: string | undefined,
): readonly UnitTrail[] {
  return layers.trails ? trails : trails.filter((trail) => trail.unitId === selectedUnitId);
}
