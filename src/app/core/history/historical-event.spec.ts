import {
  eventLastDay,
  eventsOnDay,
  HistoricalEvent,
  isEventOnDay,
  neighbouringEvent,
} from './historical-event';

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

/** Chronological list with two events sharing a start day and one spanning several days. */
const EVENTS = [event('a', 0), event('b', 0), event('c', 2, 4), event('d', 6)];
const ids = (events: readonly HistoricalEvent[]) => events.map((e) => e.id);

describe('eventLastDay', () => {
  it('is the start day for a single-day event', () => {
    expect(eventLastDay(event('x', 3))).toBe(3);
  });

  it('is the end day for a longer event', () => {
    expect(eventLastDay(event('x', 3, 5))).toBe(5);
  });
});

describe('isEventOnDay', () => {
  it('includes both the first and the last day', () => {
    const span = event('x', 2, 4);
    expect([1, 2, 3, 4, 5].map((day) => isEventOnDay(span, day))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
  });
});

describe('eventsOnDay', () => {
  it('returns every event covering the day, in list order', () => {
    expect(ids(eventsOnDay(EVENTS, 0))).toEqual(['a', 'b']);
    expect(ids(eventsOnDay(EVENTS, 3))).toEqual(['c']);
  });

  it('returns nothing on a day without events', () => {
    expect(eventsOnDay(EVENTS, 5)).toEqual([]);
  });
});

describe('neighbouringEvent', () => {
  it('steps through the list from a selected event, including same-day events', () => {
    expect(neighbouringEvent(EVENTS, 1, { eventId: 'a' })?.id).toBe('b');
    expect(neighbouringEvent(EVENTS, 1, { eventId: 'b' })?.id).toBe('c');
    expect(neighbouringEvent(EVENTS, -1, { eventId: 'c' })?.id).toBe('b');
  });

  it('returns undefined past either end of the list', () => {
    expect(neighbouringEvent(EVENTS, -1, { eventId: 'a' })).toBeUndefined();
    expect(neighbouringEvent(EVENTS, 1, { eventId: 'd' })).toBeUndefined();
  });

  it('with nothing selected, steps forwards to the first event of the day or the next one after it', () => {
    expect(neighbouringEvent(EVENTS, 1, { calendarDay: 0 })?.id).toBe('a');
    expect(neighbouringEvent(EVENTS, 1, { calendarDay: 1 })?.id).toBe('c');
    expect(neighbouringEvent(EVENTS, 1, { calendarDay: 5 })?.id).toBe('d');
    expect(neighbouringEvent(EVENTS, 1, { calendarDay: 7 })).toBeUndefined();
  });

  it('with nothing selected, steps backwards to the last event that started on an earlier day', () => {
    expect(neighbouringEvent(EVENTS, -1, { calendarDay: 0 })).toBeUndefined();
    expect(neighbouringEvent(EVENTS, -1, { calendarDay: 1 })?.id).toBe('b');
    expect(neighbouringEvent(EVENTS, -1, { calendarDay: 5 })?.id).toBe('c');
  });

  it('returns undefined for an unknown event id', () => {
    expect(neighbouringEvent(EVENTS, 1, { eventId: 'missing' })).toBeUndefined();
  });
});
