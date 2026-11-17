import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import {
  eventLastDay,
  HistoricalEvent,
  HistoricalSource,
} from '../../core/history/historical-event';
import { LocaleService } from '../i18n/locale-service';
import { TimelineStore } from '../timeline/timeline-store';

/**
 * Shows the selected event: when, what, how well it is supported and by which sources. With no
 * event selected it lists the events of the current day instead.
 */
@Component({
  selector: 'app-event-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-panel.html',
  styleUrl: './event-panel.css',
})
export class EventPanel {
  /** The user asked to go to an event (from the list or with the previous/next buttons). */
  readonly eventChosen = output<HistoricalEvent>();

  protected readonly i18n = inject(LocaleService);
  protected readonly store = inject(TimelineStore);

  protected readonly eventCount = this.store.scenario.events.length;
  /** 1-based position of the selected event in the chronological list. */
  protected readonly selectedPosition = computed(() => {
    const selected = this.store.selectedEvent();
    return selected ? this.store.scenario.events.indexOf(selected) + 1 : 0;
  });
  protected readonly selectedSources = computed<HistoricalSource[]>(() => {
    const ids = this.store.selectedEvent()?.sourceIds ?? [];
    return this.store.scenario.sources.filter((source) => ids.includes(source.id));
  });
  protected readonly currentDateLabel = computed(() =>
    this.i18n.formatDate(this.store.currentDate()),
  );

  protected dateLabel(event: HistoricalEvent): string {
    const firstDate = this.store.dateOfDay(event.startDay);
    const lastDay = eventLastDay(event);
    return lastDay === event.startDay
      ? this.i18n.formatDate(firstDate)
      : this.i18n.formatDateRange(firstDate, this.store.dateOfDay(lastDay));
  }

  protected choose(event: HistoricalEvent | undefined): void {
    if (event) this.eventChosen.emit(event);
  }
}
