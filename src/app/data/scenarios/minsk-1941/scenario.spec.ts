import { eventLastDay } from '../../../core/history/historical-event';
import { totalDays } from '../../../core/timeline/timeline-state';
import { MINSK_SCENARIO } from './scenario';

/** The area covered by the baked terrain (public/map/terrain.json). */
const MAP_BOUNDS = { west: 19.5, east: 31.5, south: 50.5, north: 56 };

const isOnMap = ({ lon, lat }: { lon: number; lat: number }) =>
  lon >= MAP_BOUNDS.west &&
  lon <= MAP_BOUNDS.east &&
  lat >= MAP_BOUNDS.south &&
  lat <= MAP_BOUNDS.north;

describe('Minsk 1941 scenario', () => {
  const { events, sources, timeRange } = MINSK_SCENARIO;
  const lastCalendarDay = timeRange.endDay - 1;

  it('covers 22 June to 9 July 1941, the 18 days of the Soviet official periodisation', () => {
    expect(MINSK_SCENARIO.epoch).toEqual({ year: 1941, month: 6, day: 22 });
    expect(totalDays(timeRange)).toBe(18);
  });

  it('is marked as researched history, not a demonstration', () => {
    expect(MINSK_SCENARIO.kind).toBe('history');
  });

  it('lists events in chronological order with unique ids', () => {
    const startDays = events.map((event) => event.startDay);
    expect(startDays).toEqual([...startDays].sort((a, b) => a - b));
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });

  it('dates every event to whole days inside the time range', () => {
    for (const event of events) {
      expect(Number.isInteger(event.startDay), event.id).toBe(true);
      expect(Number.isInteger(eventLastDay(event)), event.id).toBe(true);
      expect(event.startDay, event.id).toBeGreaterThanOrEqual(timeRange.startDay);
      expect(eventLastDay(event), event.id).toBeGreaterThanOrEqual(event.startDay);
      expect(eventLastDay(event), event.id).toBeLessThanOrEqual(lastCalendarDay);
    }
  });

  it('backs every event with at least one known source', () => {
    const sourceIds = new Set(sources.map((source) => source.id));
    for (const event of events) {
      expect(event.sourceIds.length, event.id).toBeGreaterThan(0);
      for (const id of event.sourceIds) expect(sourceIds.has(id), `${event.id} → ${id}`).toBe(true);
    }
  });

  it('has no source that nothing refers to', () => {
    const used = new Set([
      ...events.flatMap((event) => event.sourceIds),
      ...MINSK_SCENARIO.units.flatMap((unit) => unit.positions.flatMap((p) => p.sourceIds)),
    ]);
    expect(sources.filter((source) => !used.has(source.id)).map((source) => source.id)).toEqual([]);
  });

  it('explains what is uncertain whenever an event is not fully confirmed', () => {
    for (const event of events.filter((e) => e.certainty !== 'confirmed')) {
      expect(event.certaintyNote?.['zh-TW'], event.id).toBeTruthy();
    }
  });

  it('keeps every place and camera target on the map', () => {
    for (const event of events) {
      for (const place of event.places) expect(isOnMap(place.location), event.id).toBe(true);
      if (event.camera) expect(isOnMap(event.camera.target), event.id).toBe(true);
    }
  });

  it('draws the German–Soviet border of June 1941 as in force and the old Polish–Soviet border as former', () => {
    expect(MINSK_SCENARIO.borders.map(({ id, kind }) => ({ id, kind }))).toEqual([
      { id: 'german-soviet-1941', kind: 'in-force' },
      { id: 'polish-soviet-1939', kind: 'former' },
    ]);
    for (const border of MINSK_SCENARIO.borders) {
      expect(border.name['zh-TW'], border.id).toBeTruthy();
    }
  });

  describe('units', () => {
    const { units } = MINSK_SCENARIO;
    const unit = (id: string) => units.find((candidate) => candidate.id === id)!;
    const daysOf = (id: string) => unit(id).positions.map((position) => position.day);
    const allDays = Array.from({ length: 18 }, (_, day) => day);

    it('has the five motorized corps, two German armies and four Soviet armies', () => {
      expect(units.filter((u) => u.faction === 'german').map((u) => u.id)).toEqual([
        'xxiv-motorized-corps',
        'xxxxvi-motorized-corps',
        'xxxxvii-motorized-corps',
        'xxxix-motorized-corps',
        'lvii-motorized-corps',
        'german-4th-army',
        'german-9th-army',
      ]);
      expect(units.filter((u) => u.faction === 'soviet').map((u) => u.id)).toEqual([
        'soviet-3rd-army',
        'soviet-10th-army',
        'soviet-4th-army',
        'soviet-13th-army',
      ]);
    });

    it('states at most one position per calendar day, in order, inside the time range', () => {
      for (const { id, positions } of units) {
        const days = positions.map((position) => position.day);
        expect(days, id).toEqual([...new Set(days)].sort((a, b) => a - b));
        for (const day of days) {
          expect(Number.isInteger(day), id).toBe(true);
          expect(day, id).toBeGreaterThanOrEqual(timeRange.startDay);
          expect(day, id).toBeLessThanOrEqual(lastCalendarDay);
        }
      }
    });

    it('places a motorized corps on every evening it appears on the atlas sheets that were read', () => {
      for (const id of ['xxiv', 'xxxxvii', 'xxxix', 'lvii']) {
        expect(daysOf(`${id}-motorized-corps`), id).toEqual(allDays);
      }
      // Its panzer division was still behind the area read on the first three evenings.
      expect(daysOf('xxxxvi-motorized-corps')).toEqual(allDays.slice(3));
    });

    it('leaves the 9th Army off the map on 6 July, when its headquarters could not be read', () => {
      expect(daysOf('german-4th-army')).toEqual(allDays);
      expect(daysOf('german-9th-army')).toEqual(allDays.filter((day) => day !== 14));
    });

    it('shows a Soviet army only on days with a Soviet-side source', () => {
      expect(daysOf('soviet-3rd-army')).toEqual([0, 5]);
      expect(daysOf('soviet-10th-army')).toEqual([0, 4, 5, 6, 10]);
      expect(daysOf('soviet-4th-army')).toEqual([0, 1, 2, 3, 4, 5, 11]);
      expect(daysOf('soviet-13th-army')).toEqual([6, 8]);
      for (const army of units.filter((u) => u.faction === 'soviet')) {
        const sourceIds = army.positions.flatMap((position) => position.sourceIds);
        expect(sourceIds, army.id).not.toContain('okh-atlas');
      }
    });

    it('never fills the days between two stated positions with a guess', () => {
      expect(units.filter((u) => u.interpolatesGaps).map((u) => u.id)).toEqual([]);
    });

    it('backs every position with a known source and keeps it on the map', () => {
      const sourceIds = new Set(sources.map((source) => source.id));
      for (const { id, positions } of units) {
        for (const position of positions) {
          const label = `${id} day ${position.day}`;
          expect(position.sourceIds.length, label).toBeGreaterThan(0);
          for (const sourceId of position.sourceIds)
            expect(sourceIds.has(sourceId), label).toBe(true);
          expect(isOnMap(position.location), label).toBe(true);
          expect(position.description['zh-TW'], label).toBeTruthy();
        }
      }
    });

    it('explains every estimated location, and marks nothing else as needing a note', () => {
      for (const { id, positions } of units) {
        for (const position of positions) {
          const label = `${id} day ${position.day}`;
          expect(Boolean(position.note?.['zh-TW']), label).toBe(position.estimated);
          expect(position.certainty, label).not.toBe('disputed');
        }
      }
    });

    it('gives every unit a type and the number of its designation', () => {
      const symbols = units.map((u) => `${u.faction} ${u.type} ${u.ordinal}`);
      expect(symbols).toEqual([
        'german motorized-corps 24',
        'german motorized-corps 46',
        'german motorized-corps 47',
        'german motorized-corps 39',
        'german motorized-corps 57',
        'german army 4',
        'german army 9',
        'soviet army 3',
        'soviet army 10',
        'soviet army 4',
        'soviet army 13',
      ]);
    });

    it('breaks the movement only where the marker starts to stand for another part of the unit', () => {
      const breaks = units.flatMap((u) =>
        u.positions.filter((p) => p.breaksMovement).map((p) => `${u.id} day ${p.day}`),
      );
      expect(breaks).toEqual([
        'lvii-motorized-corps day 6',
        'soviet-4th-army day 3',
        'soviet-4th-army day 4',
      ]);
    });

    it('moves the LVII Motorized Corps marker back west on 28 June, as the atlas attribution implies', () => {
      const [before, after] = [5, 6].map((day) =>
        unit('lvii-motorized-corps').positions.find((position) => position.day === day)!,
      );
      expect(before.description['zh-TW']).toContain('第 12 裝甲師');
      expect(after.description['zh-TW']).toContain('第 19 裝甲師');
      expect(after.location.lon).toBeLessThan(before.location.lon - 1);
    });
  });
});
