import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HistoricalSource } from '../../core/history/historical-event';
import { LocaleService } from '../i18n/locale-service';
import { TimelineStore } from '../timeline/timeline-store';
import { StoryStore } from './story-store';

/** The current stop of the guided story: where it is, what it says, what it rests on. */
@Component({
  selector: 'app-story-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './story-panel.html',
  styleUrl: './story-panel.css',
})
export class StoryPanel {
  protected readonly i18n = inject(LocaleService);
  protected readonly story = inject(StoryStore);
  private readonly timeline = inject(TimelineStore);

  protected readonly stopCount = this.story.stops.length;
  protected readonly dateLabel = computed(() => {
    const stop = this.story.currentStop();
    return stop ? this.i18n.formatDate(this.timeline.dateOfDay(stop.day)) : '';
  });
  protected readonly sources = computed<HistoricalSource[]>(() => {
    const ids = this.story.currentStop()?.sourceIds ?? [];
    return this.timeline.scenario.sources.filter((source) => ids.includes(source.id));
  });
  protected readonly isFirst = computed(() => this.story.currentIndex() === 0);
  protected readonly isLast = computed(() => this.story.currentIndex() === this.stopCount - 1);
}
