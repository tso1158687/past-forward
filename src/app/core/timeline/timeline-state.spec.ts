import {
  advance,
  createTimelineState,
  displayedDay,
  pause,
  play,
  seek,
  setSpeed,
  TimeRange,
  totalDays,
} from './timeline-state';

const RANGE: TimeRange = { startDay: 0, endDay: 19 };

describe('createTimelineState', () => {
  it('starts paused at the beginning of the range', () => {
    expect(createTimelineState(RANGE)).toEqual({
      range: RANGE,
      currentDay: 0,
      playing: false,
      daysPerSecond: 1,
    });
  });
});

describe('seek', () => {
  it('moves to the requested day', () => {
    expect(seek(createTimelineState(RANGE), 6.5).currentDay).toBe(6.5);
  });

  it('clamps to the range', () => {
    expect(seek(createTimelineState(RANGE), -3).currentDay).toBe(0);
    expect(seek(createTimelineState(RANGE), 40).currentDay).toBe(19);
  });

  it('keeps playing if the timeline was playing', () => {
    expect(seek(play(createTimelineState(RANGE)), 5).playing).toBe(true);
  });

  it('does not mutate the previous state', () => {
    const before = createTimelineState(RANGE);
    seek(before, 5);
    expect(before.currentDay).toBe(0);
  });
});

describe('advance', () => {
  it('does nothing while paused', () => {
    const paused = seek(createTimelineState(RANGE), 3);
    expect(advance(paused, 10)).toBe(paused);
  });

  it('moves forward by elapsed time times speed', () => {
    const playing = play(setSpeed(createTimelineState(RANGE), 2));
    expect(advance(playing, 1.5).currentDay).toBe(3);
  });

  it('stops and pauses at the end of the range', () => {
    const nearEnd = play(seek(createTimelineState(RANGE), 18.5));
    const finished = advance(nearEnd, 5);
    expect(finished.currentDay).toBe(19);
    expect(finished.playing).toBe(false);
  });

  it('plays backwards with a negative speed and pauses at the start', () => {
    const reversing = play(setSpeed(seek(createTimelineState(RANGE), 4), -2));
    expect(advance(reversing, 1).currentDay).toBe(2);
    const finished = advance(reversing, 10);
    expect(finished.currentDay).toBe(0);
    expect(finished.playing).toBe(false);
  });

  it('gives the same position whether time passes in one step or many', () => {
    const start = play(createTimelineState(RANGE));
    const oneStep = advance(start, 4);
    const manySteps = [1, 0.5, 2, 0.5].reduce(advance, start);
    expect(manySteps.currentDay).toBeCloseTo(oneStep.currentDay);
  });
});

describe('play and pause', () => {
  it('restarts from the beginning when played at the end', () => {
    const atEnd = seek(createTimelineState(RANGE), 19);
    expect(play(atEnd)).toMatchObject({ currentDay: 0, playing: true });
  });

  it('resumes from the current day otherwise', () => {
    const paused = pause(seek(play(createTimelineState(RANGE)), 7));
    expect(paused.playing).toBe(false);
    expect(play(paused)).toMatchObject({ currentDay: 7, playing: true });
  });

  it('restarts from the end when played backwards at the start', () => {
    const reversed = setSpeed(createTimelineState(RANGE), -1);
    expect(play(reversed)).toMatchObject({ currentDay: 19, playing: true });
  });
});

describe('displayedDay', () => {
  it('is the whole day containing the current time', () => {
    expect(displayedDay(seek(createTimelineState(RANGE), 6.9))).toBe(6);
  });

  it('stays on the last covered day at the very end of the range', () => {
    expect(displayedDay(seek(createTimelineState(RANGE), 19))).toBe(18);
  });
});

describe('totalDays', () => {
  it('counts the calendar days the range covers', () => {
    expect(totalDays(RANGE)).toBe(19);
  });
});
