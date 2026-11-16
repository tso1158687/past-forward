import { computed, Injectable, signal } from '@angular/core';
import { deriveWorldState } from '../../core/history/world-state';
import { calendarDateOfDay } from '../../core/timeline/calendar';
import {
  advance,
  createTimelineState,
  displayedDay,
  pause,
  play,
  seek,
  setSpeed,
} from '../../core/timeline/timeline-state';
import { DEMO_SCENARIO } from '../../data/scenarios/demo-scenario';

/**
 * A long gap between frames (a background tab, a debugger pause) must not make the timeline leap
 * forward, so the time credited to a single frame is capped.
 */
const MAX_FRAME_SECONDS = 0.25;

/**
 * Holds the timeline and drives playback. All rules live in the pure functions of
 * `core/timeline` and `core/history`; this class only stores the current state in a signal and
 * feeds real elapsed time into it while playing.
 */
@Injectable({ providedIn: 'root' })
export class TimelineStore {
  /** What is being played. A fixed demonstration scenario until researched data exists. */
  readonly scenario = DEMO_SCENARIO;

  private readonly state = signal(createTimelineState(this.scenario.timeRange));
  readonly timeline = this.state.asReadonly();

  /** The situation on the map at the current time. */
  readonly worldState = computed(() => deriveWorldState(this.scenario, this.state().currentDay));
  readonly currentDate = computed(() =>
    calendarDateOfDay(this.scenario.epoch, displayedDay(this.state())),
  );

  private frameRequest = 0;
  private lastFrameTime: number | undefined;

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
