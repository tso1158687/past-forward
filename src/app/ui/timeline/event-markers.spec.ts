import { HistoricalEvent } from '../../core/history/historical-event';
import { laneCount, layOutEventMarkers } from './event-markers';

function event(id: string, startDay: number, endDay?: number): HistoricalEvent {
  return {
    id,
    startDay,
    endDay,
    title: { 'zh-TW': id },
    summary: { 'zh-TW': id },
    certainty: 'confirmed',
    places: [],
    sourceIds: ['source'],
  };
}

const RANGE = { startDay: 0, endDay: 10 };

describe('layOutEventMarkers', () => {
  it('positions a single-day event over the whole of its day', () => {
    const [marker] = layOutEventMarkers([event('a', 3)], RANGE);
    expect(marker.leftPercent).toBeCloseTo(30);
    expect(marker.widthPercent).toBeCloseTo(10);
  });

  it('stretches a longer event from its first day to the end of its last', () => {
    const [marker] = layOutEventMarkers([event('a', 2, 4)], RANGE);
    expect(marker.leftPercent).toBeCloseTo(20);
    expect(marker.widthPercent).toBeCloseTo(30);
  });

  it('puts events that overlap in time on different rows', () => {
    const markers = layOutEventMarkers([event('a', 0), event('b', 0), event('c', 0, 2)], RANGE);
    expect(markers.map((marker) => marker.lane)).toEqual([0, 1, 2]);
    expect(laneCount(markers)).toBe(3);
  });

  it('reuses a row once the earlier event on it is over', () => {
    const markers = layOutEventMarkers([event('a', 0, 1), event('b', 1), event('c', 2)], RANGE);
    expect(markers.map((marker) => marker.lane)).toEqual([0, 1, 0]);
  });

  it('has no rows when there are no events', () => {
    expect(laneCount(layOutEventMarkers([], RANGE))).toBe(0);
  });
});
