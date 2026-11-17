import { MilitaryUnit, UnitPosition } from '../../core/history/scenario';
import { WorldState } from '../../core/history/world-state';
import { toUnitMarkers } from './unit-markers';

const position = (estimated: boolean): UnitPosition => ({
  day: 0,
  location: { lon: 24, lat: 52 },
  description: { 'zh-TW': '測試位置' },
  certainty: 'confirmed',
  estimated,
  sourceIds: ['source'],
});

const unit = (id: string, faction: MilitaryUnit['faction']): MilitaryUnit => ({
  id,
  name: { 'zh-TW': `部隊 ${id}`, en: `Unit ${id}` },
  faction,
  placement: { 'zh-TW': '測試' },
  interpolatesGaps: true,
  positions: [],
});

const UNITS = [unit('a', 'german'), unit('b', 'soviet'), unit('c', 'german')];
const text = (value: { 'zh-TW': string }) => value['zh-TW'];

describe('toUnitMarkers', () => {
  const worldState: WorldState = {
    day: 0,
    events: [],
    units: [
      { unitId: 'a', location: { lon: 24, lat: 52 }, basis: 'anchor', stated: position(false) },
      { unitId: 'b', location: { lon: 25, lat: 53 }, basis: 'anchor', stated: position(true) },
      { unitId: 'c', location: { lon: 26, lat: 54 }, basis: 'interpolated' },
      { unitId: 'unknown', location: { lon: 27, lat: 55 }, basis: 'anchor' },
    ],
  };

  it('names each unit present and passes on its side and location', () => {
    expect(toUnitMarkers(worldState, UNITS, undefined, text)).toEqual([
      {
        id: 'a',
        label: '部隊 a',
        location: { lon: 24, lat: 52 },
        faction: 'german',
        basis: 'stated',
        selected: false,
      },
      {
        id: 'b',
        label: '部隊 b',
        location: { lon: 25, lat: 53 },
        faction: 'soviet',
        basis: 'estimated',
        selected: false,
      },
      {
        id: 'c',
        label: '部隊 c',
        location: { lon: 26, lat: 54 },
        faction: 'german',
        basis: 'interpolated',
        selected: false,
      },
    ]);
  });

  it('marks only the selected unit', () => {
    const selected = toUnitMarkers(worldState, UNITS, 'b', text).filter(
      (marker) => marker.selected,
    );
    expect(selected.map((marker) => marker.id)).toEqual(['b']);
  });
});
