import { computed, Injectable, signal } from '@angular/core';
import { HistoricalEvent, neighbouringEvent } from '../../core/history/historical-event';
import { MilitaryUnit } from '../../core/history/scenario';
import { deriveWorldState, UnitState } from '../../core/history/world-state';
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

/** A unit the user picked, with where it is right now if any source places it today. */
export interface SelectedUnit {
  readonly unit: MilitaryUnit;
  readonly state: UnitState | undefined;
}

export type PlaybackDirection = 'forward' | 'backward';

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
  private readonly selectedUnitId = signal<string | null>(null);
  /**
   * The unit the user picked. It stays selected on days when no source places it, so that the
   * panel can say so instead of silently closing.
   */
  readonly selectedUnit = computed<SelectedUnit | undefined>(() => {
    const unit = this.scenario.units.find((candidate) => candidate.id === this.selectedUnitId());
    if (!unit) return undefined;
    return { unit, state: this.worldState().units.find((state) => state.unitId === unit.id) };
  });

  readonly previousEvent = computed(() => this.neighbour(-1));
  readonly nextEvent = computed(() => this.neighbour(1));

  /**
   * Counts the times the user moved the timeline: pressing play or pause, dragging, changing the
   * speed or choosing an event. The guided story leaves as soon as this changes.
   */
  private readonly userActionCount = signal(0);
  readonly userActions = this.userActionCount.asReadonly();

  /** While the story plays through to a stop: the day to stop on and the speed to restore. */
  private readonly journey = signal<{ readonly toDay: number; readonly userSpeed: number } | null>(
    null,
  );
  /**
   * The playback speed the user chose. While the story plays through to a stop the timeline runs
   * at the story's own speed, but the speed control keeps showing the user's choice.
   */
  readonly chosenSpeed = computed(() =>
    Math.abs(this.journey()?.userSpeed ?? this.state().daysPerSecond),
  );
  /** Which way the timeline is playing, or `null` while it is paused. */
  readonly playingDirection = computed<PlaybackDirection | null>(() => {
    const { playing, daysPerSecond } = this.state();
    if (!playing) return null;
    return daysPerSecond < 0 ? 'backward' : 'forward';
  });

  private frameRequest = 0;
  private lastFrameTime: number | undefined;

  dateOfDay(campaignDay: number): CalendarDate {
    return calendarDateOfDay(this.scenario.epoch, campaignDay);
  }

  /** Plays in `direction`, or pauses when the timeline is already playing that way. */
  togglePlayback(direction: PlaybackDirection = 'forward'): void {
    this.byUser();
    if (this.playingDirection() === direction) {
      this.pause();
      return;
    }
    const speed = Math.abs(this.state().daysPerSecond);
    this.state.update((state) => setSpeed(state, direction === 'backward' ? -speed : speed));
    this.play();
  }

  play(): void {
    this.state.update(play);
    this.startClock();
  }

  pause(): void {
    this.state.update(pause);
  }

  seek(day: number): void {
    this.byUser();
    this.state.update((state) => seek(state, day));
  }

  /** Sets how many days pass per second, keeping the direction of play. */
  setSpeed(daysPerSecond: number): void {
    this.byUser();
    this.state.update((state) =>
      setSpeed(state, state.daysPerSecond < 0 ? -daysPerSecond : daysPerSecond),
    );
  }

  /** Pauses on the first day of the event and makes it the selected one. */
  selectEvent(event: HistoricalEvent): void {
    this.byUser();
    this.state.update((state) => seek(pause(state), event.startDay));
    this.selectedEventId.set(event.id);
  }

  /**
   * Takes the timeline to `day` for the guided story: plays through the days in between at
   * `daysPerSecond` and stops on `day`, or jumps there when no speed is given. The user's own
   * playback speed is restored on arrival. This is not a user action.
   */
  travelTo(day: number, daysPerSecond?: number): void {
    this.endJourney();
    this.selectedEventId.set(null);
    if (daysPerSecond === undefined) {
      this.state.update((state) => seek(pause(state), day));
      return;
    }
    this.journey.set({ toDay: day, userSpeed: this.state().daysPerSecond });
    this.state.update((state) => play(setSpeed(state, daysPerSecond)));
    this.startClock();
  }

  selectUnit(unitId: string): void {
    this.selectedUnitId.set(unitId);
  }

  clearUnitSelection(): void {
    this.selectedUnitId.set(null);
  }

  /** Stops a journey of the story where it is, restoring the user's speed. Not a user action. */
  stopTravel(): void {
    if (!this.journey()) return;
    this.state.update(pause);
    this.endJourney();
  }

  /** The user took over: any journey of the story stops where it is. */
  private byUser(): void {
    this.endJourney();
    this.userActionCount.update((count) => count + 1);
  }

  private endJourney(): void {
    const journey = this.journey();
    if (!journey) return;
    this.journey.set(null);
    this.state.update((state) => setSpeed(state, journey.userSpeed));
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
    const journey = this.journey();
    if (journey && this.state().currentDay >= journey.toDay) {
      this.state.update((state) => seek(pause(state), journey.toDay));
      this.endJourney();
    }
    this.frameRequest = this.state().playing ? requestAnimationFrame(this.onFrame) : 0;
  };
}
