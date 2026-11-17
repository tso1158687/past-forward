import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HistoricalSource } from '../../core/history/historical-event';
import { LocaleService } from '../i18n/locale-service';
import { locationBasis } from '../map-view/unit-markers';
import { TimelineStore } from '../timeline/timeline-store';

/**
 * Shows the selected unit: where it is on the current day, what that location stands for, how
 * well it is supported and by which sources. On a day when no source places the unit it says so.
 */
@Component({
  selector: 'app-unit-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unit-panel.html',
  styleUrl: './unit-panel.css',
})
export class UnitPanel {
  protected readonly i18n = inject(LocaleService);
  protected readonly store = inject(TimelineStore);

  protected readonly dateLabel = computed(() => this.i18n.formatDate(this.store.currentDate()));
  protected readonly basis = computed(() => {
    const state = this.store.selectedUnit()?.state;
    return state ? locationBasis(state) : undefined;
  });
  protected readonly sources = computed<HistoricalSource[]>(() => {
    const ids = this.store.selectedUnit()?.state?.stated?.sourceIds ?? [];
    return this.store.scenario.sources.filter((source) => ids.includes(source.id));
  });
}
