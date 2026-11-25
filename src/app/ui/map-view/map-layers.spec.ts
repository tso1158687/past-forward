import type { SituationView } from '../../scene/layers/situation-layer';
import type { UnitTrail } from '../../scene/layers/unit-layer';
import { ALL_MAP_LAYERS, situationWithLayers, trailsWithLayers } from './map-layers';

const VIEW: SituationView = {
  front: [
    { lon: 25, lat: 55 },
    { lon: 25, lat: 52 },
  ],
  reach: [
    { lon: 26, lat: 55 },
    { lon: 26, lat: 52 },
  ],
  arrows: [
    {
      points: [
        { lon: 24, lat: 54 },
        { lon: 25, lat: 54 },
      ],
      style: 'solid',
    },
  ],
  frontLabel: 'front',
  pockets: [{ outline: [{ lon: 24, lat: 53 }], label: 'pocket', description: 'd' }],
};

const TRAILS: UnitTrail[] = [
  { unitId: 'a', faction: 'german', lines: [[{ lon: 24, lat: 54 }]] },
  { unitId: 'b', faction: 'soviet', lines: [[{ lon: 26, lat: 53 }]] },
];

describe('situationWithLayers', () => {
  it('hands the view on unchanged when every overlay is on', () => {
    expect(situationWithLayers(VIEW, ALL_MAP_LAYERS)).toBe(VIEW);
  });

  it('leaves out the front, the reached area and the pockets but keeps the arrows', () => {
    const view = situationWithLayers(VIEW, { ...ALL_MAP_LAYERS, front: false });
    expect(view).toEqual({ ...VIEW, front: [], reach: [], pockets: [] });
  });

  it('leaves out only the arrows', () => {
    const view = situationWithLayers(VIEW, { ...ALL_MAP_LAYERS, arrows: false });
    expect(view).toEqual({ ...VIEW, arrows: [] });
  });

  it('has nothing to show on a day without a situation', () => {
    expect(situationWithLayers(undefined, { ...ALL_MAP_LAYERS, front: false })).toBeUndefined();
  });
});

describe('trailsWithLayers', () => {
  it('keeps every trail when trails are on', () => {
    expect(trailsWithLayers(TRAILS, ALL_MAP_LAYERS, undefined)).toBe(TRAILS);
  });

  it("keeps only the selected unit's trail when trails are off", () => {
    const off = { ...ALL_MAP_LAYERS, trails: false };
    expect(trailsWithLayers(TRAILS, off, 'b').map((trail) => trail.unitId)).toEqual(['b']);
    expect(trailsWithLayers(TRAILS, off, undefined)).toEqual([]);
  });
});
