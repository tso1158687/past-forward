import { computed, Injectable, signal } from '@angular/core';
import { HistoricalEvent, neighbouringEvent } from '../../core/history/historical-event';
import { deriveWorldState } from '../../core/history/world-state';
import { CalendarDate, calendarDateOfDay } from '../../core/timeline/calendar';
import {
  advance,
  createTimelineState,
  displayedDay,
  pause,
  play,
  seek,
  setSpeed,
} from '../../core/timeline/timeline-state';
import { MINSK_SCENARIO } from '../../data/scenarios/minsk-1941/scenario';

/**
 * A long gap between frames (a background tab, a debugger pause) must not make the timeline leap
 * forward, so the time credited to a single frame is capped.
 */
const MAX_FRAME_SECONDS = 0.25;

/**
 * Holds the timeline and drives playback. All rules live in the pure functions of
 * `core/timeline` and `core/history`; this class only stores the current state in signals and
 * feeds real elapsed time into it while playing.
 */
@Injectable({ providedIn: 'root' })
export class TimelineStore {
  /** What is being played. */
  readonly scenario = MINSK_SCENARIO;

  private readonly state = signal(createTimelineState(this.scenario.timeRange));
  readonly timeline = this.state.asReadonly();

  /** The whole calendar day shown for the current time. */
  readonly calendarDay = computed(() => displayedDay(this.state()));
  readonly currentDate = computed(() => this.dateOfDay(this.calendarDay()));
  /** The situation on the map at the current time. */
  readonly worldState = computed(() => deriveWorldState(this.scenario, this.state().currentDay));

  private readonly selectedEventId = signal<string | null>(null);
  /**
   * The event the user picked, for as long as the timeline stays within its days. Moving the
   * timeline elsewhere drops the selection without anyone having to clear it.
   */
  readonly selectedEvent = computed(() =>
    this.worldState().events.find((event) => event.id === this.selectedEventId()),
  );
  readonly previousEvent = computed(() => this.neighbour(-1));
  readonly nextEvent = computed(() => this.neighbour(1));

  private frameRequest = 0;
  private lastFrameTime: number | undefined;

  dateOfDay(campaignDay: number): CalendarDate {
    return calendarDateOfDay(this.scenario.epoch, campaignDay);
  }

  togglePlayback(): void {
    if (this.state().playing) this.pause();
    else this.play();
  }

  play(): void {
    this.state.update(play);
    this.startClock();
  }

  pause(): void {
    this.state.update(pause);
  }

  seek(day: number): void {
    this.state.update((state) => seek(state, day));
  }

  setSpeed(daysPerSecond: number): void {
    this.state.update((state) => setSpeed(state, daysPerSecond));
  }

  /** Pauses on the first day of the event and makes it the selected one. */
  selectEvent(event: HistoricalEvent): void {
    this.state.update((state) => seek(pause(state), event.startDay));
    this.selectedEventId.set(event.id);
  }

  private neighbour(direction: 1 | -1): HistoricalEvent | undefined {
    const selected = this.selectedEvent();
    return neighbouringEvent(
      this.scenario.events,
      direction,
      selected ? { eventId: selected.id } : { calendarDay: this.calendarDay() },
    );
  }

  private startClock(): void {
    if (this.frameRequest !== 0) return;
    this.lastFrameTime = undefined;
    this.frameRequest = requestAnimationFrame(this.onFrame);
  }

  /** Runs once per frame while playing and stops asking for frames as soon as playback ends. */
  private readonly onFrame = (time: number): void => {
    const elapsedSeconds =
      this.lastFrameTime === undefined
        ? 0
        : Math.min((time - this.lastFrameTime) / 1000, MAX_FRAME_SECONDS);
    this.lastFrameTime = time;
    this.state.update((state) => advance(state, elapsedSeconds));
    this.frameRequest = this.state().playing ? requestAnimationFrame(this.onFrame) : 0;
  };
}
