import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HistoricalEvent } from './core/history/historical-event';
import { CITIES, City } from './data/map/cities';
import { EventPanel } from './ui/events/event-panel';
import { LocaleService } from './ui/i18n/locale-service';
import { MapView } from './ui/map-view/map-view';
import { toPlaceMarkers } from './ui/map-view/place-markers';
import { toUnitMarkers } from './ui/map-view/unit-markers';
import { TimelineBar } from './ui/timeline/timeline-bar';
import { TimelineStore } from './ui/timeline/timeline-store';

const WIDE_SCREEN_QUERY = '(min-width: 721px)';

@Component({
  imports: [EventPanel, MapView, TimelineBar],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(LocaleService);
  private readonly timeline = inject(TimelineStore);

  protected readonly cities = CITIES;
  /** On narrow screens the data notice starts collapsed so that it does not cover the map. */
  protected readonly noticeInitiallyOpen =
    typeof matchMedia !== 'function' || matchMedia(WIDE_SCREEN_QUERY).matches;

  /** The units on the map at the timeline's current time. */
  protected readonly unitMarkers = computed(() =>
    toUnitMarkers(this.timeline.worldState(), this.timeline.scenario.units, (text) =>
      this.i18n.text(text),
    ),
  );

  /** The places of the selected event, pointed out on the map. */
  protected readonly placeMarkers = computed(() =>
    toPlaceMarkers(this.timeline.selectedEvent(), (text) => this.i18n.text(text)),
  );

  private readonly selectedCityId = signal<string | null>(null);
  protected readonly selectedCity = computed<City | undefined>(() =>
    this.cities.find((city) => city.id === this.selectedCityId()),
  );

  private readonly mapView = viewChild.required(MapView);

  protected selectCity(cityId: string): void {
    this.selectedCityId.set(cityId);
    const city = this.selectedCity();
    if (city) this.mapView().focusOn(city.location);
  }

  /** Jumps the timeline to an event and turns the camera to where it happened. */
  protected chooseEvent(event: HistoricalEvent): void {
    this.timeline.selectEvent(event);
    if (event.camera) this.mapView().focusOn(event.camera.target, event.camera.distanceKm);
    else this.mapView().resetView();
  }

  protected clearSelection(): void {
    this.selectedCityId.set(null);
  }

  protected resetView(): void {
    this.clearSelection();
    this.mapView().resetView();
  }

  protected formatCoordinates({ location }: City): string {
    const latitude = `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? 'N' : 'S'}`;
    const longitude = `${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? 'E' : 'W'}`;
    return `${latitude}, ${longitude}`;
  }
}
