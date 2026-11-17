import { MilitaryUnit } from '../../core/history/scenario';
import { UnitState, WorldState } from '../../core/history/world-state';
import { LocalizedText } from '../../core/i18n/localized-text';
import type { UnitMarker } from '../../scene/layers/unit-layer';

/** Turns the world state into the plain markers the scene draws. */
export function toUnitMarkers(
  worldState: WorldState,
  units: readonly MilitaryUnit[],
  selectedUnitId: string | undefined,
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
      faction: unit.faction,
      basis: locationBasis(state),
      selected: unit.id === selectedUnitId,
    };
  });
}

/** How the unit's location on screen was obtained, in the three kinds the map tells apart. */
export function locationBasis(state: UnitState): UnitMarker['basis'] {
  if (state.basis === 'interpolated') return 'interpolated';
  return state.stated?.estimated ? 'estimated' : 'stated';
}
