import { eventLastDay, HistoricalEvent } from '../../core/history/historical-event';
import { TimeRange } from '../../core/timeline/timeline-state';

/** Where to draw an event on the timeline track. */
export interface EventMarker {
  readonly event: HistoricalEvent;
  /** Left edge and width as percentages of the track. */
  readonly leftPercent: number;
  readonly widthPercent: number;
  /** Row within the track; events that overlap in time are stacked on different rows. */
  readonly lane: number;
}

/**
 * Lays events out along the timeline. An event covers its whole days, so one on day 3 spans from
 * 3.0 to 4.0. Each event goes on the first row where it does not overlap an earlier one.
 */
export function layOutEventMarkers(
  events: readonly HistoricalEvent[],
  range: TimeRange,
): EventMarker[] {
  const length = range.endDay - range.startDay;
  const lastDayPerLane: number[] = [];

  return events.map((event) => {
    const lastDay = eventLastDay(event);
    let lane = lastDayPerLane.findIndex((laneLastDay) => laneLastDay < event.startDay);
    if (lane === -1) lane = lastDayPerLane.length;
    lastDayPerLane[lane] = lastDay;

    return {
      event,
      leftPercent: ((event.startDay - range.startDay) / length) * 100,
      widthPercent: ((lastDay + 1 - event.startDay) / length) * 100,
      lane,
    };
  });
}

export function laneCount(markers: readonly EventMarker[]): number {
  return markers.reduce((count, marker) => Math.max(count, marker.lane + 1), 0);
}
