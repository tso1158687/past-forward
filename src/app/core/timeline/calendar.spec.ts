import { CalendarDate, calendarDateOfDay, dayOfCalendarDate } from './calendar';

const EPOCH: CalendarDate = { year: 1941, month: 6, day: 22 };

describe('calendarDateOfDay', () => {
  it('maps day 0 to the epoch date', () => {
    expect(calendarDateOfDay(EPOCH, 0)).toEqual(EPOCH);
  });

  it('keeps the same date for the whole day', () => {
    expect(calendarDateOfDay(EPOCH, 0.999)).toEqual(EPOCH);
    expect(calendarDateOfDay(EPOCH, 1)).toEqual({ year: 1941, month: 6, day: 23 });
  });

  it('crosses month boundaries (June has 30 days)', () => {
    expect(calendarDateOfDay(EPOCH, 8)).toEqual({ year: 1941, month: 6, day: 30 });
    expect(calendarDateOfDay(EPOCH, 9)).toEqual({ year: 1941, month: 7, day: 1 });
  });

  it('handles days before the epoch', () => {
    expect(calendarDateOfDay(EPOCH, -1)).toEqual({ year: 1941, month: 6, day: 21 });
    expect(calendarDateOfDay(EPOCH, -0.5)).toEqual({ year: 1941, month: 6, day: 21 });
  });
});

describe('dayOfCalendarDate', () => {
  it('is the inverse of calendarDateOfDay for whole days', () => {
    expect(dayOfCalendarDate(EPOCH, EPOCH)).toBe(0);
    expect(dayOfCalendarDate(EPOCH, { year: 1941, month: 7, day: 10 })).toBe(18);
    expect(dayOfCalendarDate(EPOCH, { year: 1941, month: 6, day: 21 })).toBe(-1);
  });
});
