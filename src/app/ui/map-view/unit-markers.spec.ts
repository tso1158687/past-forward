import { MilitaryUnit, UnitPosition } from '../../core/history/scenario';
import { WorldState } from '../../core/history/world-state';
import { toUnitMarkers, toUnitTrails, unitTransition } from './unit-markers';

const position = (day: number, lon: number, estimated = false): UnitPosition => ({
  day,
  location: { lon, lat: 52 },
  description: { 'zh-TW': '測試位置' },
  certainty: 'confirmed',
  estimated,
  breaksMovement: false,
  sourceIds: ['source'],
});

const unit = (
  id: string,
  faction: MilitaryUnit['faction'],
  type: MilitaryUnit['type'],
  ordinal: number,
  positions: UnitPosition[] = [],
): MilitaryUnit => ({
  id,
  name: { 'zh-TW': `部隊 ${id}`, en: `Unit ${id}` },
  faction,
  type,
  ordinal,
  placement: { 'zh-TW': '測試' },
  interpolatesGaps: false,
  positions,
});

const UNITS = [
  unit('corps', 'german', 'motorized-corps', 47),
  unit('army', 'german', 'army', 4),
  unit('soviet', 'soviet', 'army', 13),
];
const TEXT = {
  text: (value: { 'zh-TW': string }) => value['zh-TW'],
  typeCharacter: { 'motorized-corps': '甲', army: '步' },
};

describe('toUnitMarkers', () => {
  const worldState: WorldState = {
    day: 0,
    events: [],
    units: [
      {
        unitId: 'corps',
        location: { lon: 24, lat: 52 },
        basis: 'anchor',
        stated: position(0, 24),
        run: 2,
      },
      { unitId: 'army', location: { lon: 26, lat: 54 }, basis: 'interpolated', run: 0 },
      {
        unitId: 'soviet',
        location: { lon: 25, lat: 53 },
        basis: 'anchor',
        stated: position(0, 25, true),
        run: 1,
      },
      { unitId: 'unknown', location: { lon: 27, lat: 55 }, basis: 'anchor', run: 0 },
    ],
  };
  const markers = toUnitMarkers(worldState, UNITS, 'soviet', TEXT);
  const marker = (id: string) => markers.find((candidate) => candidate.id === id)!;

  it('makes one marker per known unit that is present', () => {
    expect(markers.map((m) => m.id)).toEqual(['corps', 'army', 'soviet']);
  });

  it('passes on the name, side, location and run of movement', () => {
    expect(marker('corps')).toMatchObject({
      label: '部隊 corps',
      faction: 'german',
      location: { lon: 24, lat: 52 },
      run: 2,
    });
  });

  it('puts the character of the unit type and its number on a German piece', () => {
    expect(marker('corps').symbol).toEqual({ kind: 'character', character: '甲' });
    expect(marker('corps').number).toBe('47');
    expect(marker('army').symbol).toEqual({ kind: 'character', character: '步' });
  });

  it('puts the red star on a Soviet piece, whatever its type', () => {
    expect(marker('soviet').symbol).toEqual({ kind: 'star' });
    expect(marker('soviet').number).toBe('13');
  });

  it('tells stated, estimated and interpolated locations apart', () => {
    expect(markers.map((m) => m.basis)).toEqual(['stated', 'interpolated', 'estimated']);
  });

  it('marks only the selected unit', () => {
    expect(markers.filter((m) => m.selected).map((m) => m.id)).toEqual(['soviet']);
  });
});

describe('toUnitTrails', () => {
  const units = [
    unit('early', 'german', 'motorized-corps', 1, [position(0, 20), position(1, 21)]),
    unit('late', 'soviet', 'army', 2, [position(5, 30)]),
  ];

  it('gives each unit that has appeared its trail so far, with its side', () => {
    expect(toUnitTrails(units, 1)).toEqual([
      {
        unitId: 'early',
        faction: 'german',
        lines: [
          [
            { lon: 20, lat: 52 },
            { lon: 21, lat: 52 },
          ],
        ],
      },
    ]);
  });

  it('adds a unit once its first stated day has come', () => {
    expect(toUnitTrails(units, 5).map((trail) => trail.unitId)).toEqual(['early', 'late']);
  });
});

describe('unitTransition', () => {
  it('lets a piece take one day of playback to reach the next position, without easing', () => {
    expect(unitTransition({ playing: true, daysPerSecond: 2 })).toEqual({
      seconds: 0.5,
      easing: 'linear',
    });
    expect(unitTransition({ playing: true, daysPerSecond: -1 }).seconds).toBe(1);
  });

  it('never slides for more than two seconds, however slow the playback', () => {
    expect(unitTransition({ playing: true, daysPerSecond: 0.25 }).seconds).toBe(2);
  });

  it('glides briefly with easing after a jump to another date', () => {
    expect(unitTransition({ playing: false, daysPerSecond: 1 })).toEqual({
      seconds: 0.6,
      easing: 'eased',
    });
  });
});
