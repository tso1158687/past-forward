import { MilitaryUnit, UnitType } from '../../core/history/scenario';
import { unitTrail } from '../../core/history/unit-movement';
import { UnitState, WorldState } from '../../core/history/world-state';
import { LocalizedText } from '../../core/i18n/localized-text';
import type { UnitMarker, UnitTrail, UnitTransition } from '../../scene/layers/unit-layer';

/** The interface text a piece needs: the unit's name and the character for its type. */
export interface UnitMarkerText {
  text(value: LocalizedText): string;
  /** The single character drawn on the piece of a unit of each type. */
  readonly typeCharacter: Readonly<Record<UnitType, string>>;
}

/** Turns the world state into the plain markers the scene draws. */
export function toUnitMarkers(
  worldState: WorldState,
  units: readonly MilitaryUnit[],
  selectedUnitId: string | undefined,
  { text, typeCharacter }: UnitMarkerText,
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
      // Soviet pieces carry the red star; German pieces a character for the type of formation.
      symbol:
        unit.faction === 'soviet'
          ? { kind: 'star' }
          : { kind: 'character', character: typeCharacter[unit.type] },
      number: String(unit.ordinal),
      basis: locationBasis(state),
      selected: unit.id === selectedUnitId,
      run: state.run,
    };
  });
}

/** How the unit's location on screen was obtained, in the three kinds the map tells apart. */
export function locationBasis(state: UnitState): UnitMarker['basis'] {
  if (state.basis === 'interpolated') return 'interpolated';
  return state.stated?.estimated ? 'estimated' : 'stated';
}

/** Where each unit has been up to `calendarDay`; units that have not appeared yet are left out. */
export function toUnitTrails(units: readonly MilitaryUnit[], calendarDay: number): UnitTrail[] {
  return units
    .map((unit) => ({
      unitId: unit.id,
      faction: unit.faction,
      lines: unitTrail(unit, calendarDay),
    }))
    .filter((trail) => trail.lines.length > 0);
}

/** A slide never takes longer than this, however slowly the timeline plays. */
const MAX_SLIDE_SECONDS = 2;
/** How long pieces take to reach their place after a jump to another date. */
const JUMP_SLIDE_SECONDS = 0.6;

/**
 * While the timeline plays, a piece takes one day of playback to reach the next evening's
 * position, so that one slide runs into the next; after a jump it glides there briefly.
 */
export function unitTransition(playback: {
  readonly playing: boolean;
  readonly daysPerSecond: number;
}): UnitTransition {
  if (!playback.playing) return { seconds: JUMP_SLIDE_SECONDS, easing: 'eased' };
  const secondsPerDay = 1 / Math.abs(playback.daysPerSecond);
  return { seconds: Math.min(secondsPerDay, MAX_SLIDE_SECONDS), easing: 'linear' };
}
