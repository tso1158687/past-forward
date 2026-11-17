/**
 * The span of a timeline in campaign days. `endDay` is the moment the timeline stops, so a
 * timeline covering whole calendar days 0 to 18 has `startDay: 0, endDay: 19`.
 */
export interface TimeRange {
  readonly startDay: number;
  readonly endDay: number;
}

/** Where the timeline is and whether it is playing. Immutable: every change returns a new state. */
export interface TimelineState {
  readonly range: TimeRange;
  /** Current time in campaign days, always within `range`. */
  readonly currentDay: number;
  readonly playing: boolean;
  /** Playback speed. Negative values play backwards. */
  readonly daysPerSecond: number;
}

export const DEFAULT_DAYS_PER_SECOND = 1;

export function createTimelineState(
  range: TimeRange,
  daysPerSecond = DEFAULT_DAYS_PER_SECOND,
): TimelineState {
  return { range, currentDay: range.startDay, playing: false, daysPerSecond };
}

/** Jumps to a day, clamped to the range. Does not change whether the timeline is playing. */
export function seek(state: TimelineState, day: number): TimelineState {
  return { ...state, currentDay: clampToRange(state.range, day) };
}

/**
 * Starts playback. If the timeline already sits at the end it is heading towards, it restarts
 * from the opposite end, so pressing play after the story finished replays it.
 */
export function play(state: TimelineState): TimelineState {
  const { range, currentDay, daysPerSecond } = state;
  const forwards = daysPerSecond >= 0;
  const atFarEnd = forwards ? currentDay >= range.endDay : currentDay <= range.startDay;
  const restartDay = forwards ? range.startDay : range.endDay;
  return { ...state, currentDay: atFarEnd ? restartDay : currentDay, playing: true };
}

export function pause(state: TimelineState): TimelineState {
  return { ...state, playing: false };
}

export function setSpeed(state: TimelineState, daysPerSecond: number): TimelineState {
  return { ...state, daysPerSecond };
}

/** Moves a playing timeline forward by real elapsed time; it pauses when it reaches either end. */
export function advance(state: TimelineState, elapsedSeconds: number): TimelineState {
  if (!state.playing) return state;
  const target = state.currentDay + elapsedSeconds * state.daysPerSecond;
  const currentDay = clampToRange(state.range, target);
  return { ...state, currentDay, playing: currentDay === target };
}

/**
 * The whole calendar day to show for the current time. At the very end of the range this is
 * still the last day covered, not the day after it.
 */
export function displayedDay(state: Pick<TimelineState, 'range' | 'currentDay'>): number {
  const lastDay = Math.ceil(state.range.endDay) - 1;
  return Math.min(Math.floor(state.currentDay), lastDay);
}

/** Number of calendar days the range covers. */
export function totalDays(range: TimeRange): number {
  return Math.ceil(range.endDay) - Math.floor(range.startDay);
}

function clampToRange(range: TimeRange, day: number): number {
  return Math.min(Math.max(day, range.startDay), range.endDay);
}
