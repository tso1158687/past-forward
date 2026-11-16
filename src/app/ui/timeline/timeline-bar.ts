import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { displayedDay, totalDays } from '../../core/timeline/timeline-state';
import { LocaleService } from '../i18n/locale-service';
import { TimelineStore } from './timeline-store';

/** Playback speeds offered to the user, in campaign days per second. */
const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

/** Play/pause, the current date, a scrubber and the playback speed. */
@Component({
  selector: 'app-timeline-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-bar.html',
  styleUrl: './timeline-bar.css',
})
export class TimelineBar {
  protected readonly i18n = inject(LocaleService);
  protected readonly store = inject(TimelineStore);
  protected readonly speedOptions = SPEED_OPTIONS;

  protected readonly formattedDate = computed(() => this.i18n.formatDate(this.store.currentDate()));
  protected readonly totalDays = totalDays(this.store.scenario.timeRange);
  /** 1 on the first day of the scenario. */
  protected readonly dayNumber = computed(() => {
    const timeline = this.store.timeline();
    return displayedDay(timeline) - Math.floor(timeline.range.startDay) + 1;
  });

  protected onScrub(event: Event): void {
    this.store.seek((event.target as HTMLInputElement).valueAsNumber);
  }

  protected onSpeedChange(event: Event): void {
    this.store.setSpeed(Number((event.target as HTMLSelectElement).value));
  }
}
