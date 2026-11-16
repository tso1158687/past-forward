import { MilitaryUnit } from '../../core/history/scenario';
import { WorldState } from '../../core/history/world-state';
import { LocalizedText } from '../../core/i18n/localized-text';
import type { UnitMarker } from '../../scene/layers/unit-layer';

/** Turns the world state into the plain markers the scene draws. */
export function toUnitMarkers(
  worldState: WorldState,
  units: readonly MilitaryUnit[],
  text: (value: LocalizedText) => string,
): UnitMarker[] {
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  return worldState.units.flatMap((state) => {
    const unit = unitsById.get(state.unitId);
    if (!unit) return [];
    return {
      id: unit.id,
      label: text(unit.name),
      location: state.location,
      interpolated: state.basis === 'interpolated',
    };
  });
}
