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
    const used = new Set(events.flatMap((event) => event.sourceIds));
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

  it('shows no units, because unit positions have not been researched yet', () => {
    expect(MINSK_SCENARIO.units).toEqual([]);
  });
});
