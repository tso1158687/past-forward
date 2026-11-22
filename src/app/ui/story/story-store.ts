import { computed, inject, Injectable, signal } from '@angular/core';
import { StoryStop, travelTo } from '../../core/history/story';
import { TimelineStore } from '../timeline/timeline-store';

/**
 * Runs the guided story. It moves the timeline from stop to stop and steps aside the moment the
 * user moves the timeline themselves; the user can then pick the story up where it was left.
 */
@Injectable({ providedIn: 'root' })
export class StoryStore {
  private readonly timeline = inject(TimelineStore);
  readonly stops = this.timeline.scenario.story;

  /** Index of the stop the story is on, or null when it has not started or was left. */
  private readonly index = signal<number | null>(null);
  /** The stop to resume from after leaving. */
  private readonly lastIndex = signal<number | null>(null);
  /** The count of user actions when the story last moved; any later action ends the story. */
  private readonly userActionsAtLastStep = signal(0);

  readonly active = computed(
    () => this.index() !== null && this.timeline.userActions() === this.userActionsAtLastStep(),
  );
  readonly currentIndex = computed(() => (this.active() ? this.index() : null));
  readonly currentStop = computed<StoryStop | undefined>(() => {
    const index = this.currentIndex();
    return index === null ? undefined : this.stops[index];
  });
  /** Where the story would continue from, once it has been started and left. */
  readonly resumeIndex = computed(() => (this.active() ? null : this.lastIndex()));

  start(): void {
    this.goTo(0);
  }

  resume(): void {
    this.goTo(this.lastIndex() ?? 0);
  }

  next(): void {
    const index = this.currentIndex();
    if (index !== null && index < this.stops.length - 1) this.goTo(index + 1);
  }

  previous(): void {
    const index = this.currentIndex();
    if (index !== null && index > 0) this.goTo(index - 1);
  }

  leave(): void {
    this.timeline.stopTravel();
    this.index.set(null);
  }

  private goTo(index: number): void {
    const stop = this.stops[index];
    const travel = travelTo(this.timeline.calendarDay(), stop.day);
    this.timeline.travelTo(stop.day, travel.kind === 'play' ? travel.daysPerSecond : undefined);
    this.userActionsAtLastStep.set(this.timeline.userActions());
    this.index.set(index);
    this.lastIndex.set(index);
  }
}
