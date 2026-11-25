import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { GeographicLocation } from './core/geo/geo-types';
import { reachedLine } from './core/history/front-situation';
import { HistoricalEvent } from './core/history/historical-event';
import { CITIES, City } from './data/map/cities';
import { EventPanel } from './ui/events/event-panel';
import { LayerMenu } from './ui/layers/layer-menu';
import { StoryPanel } from './ui/story/story-panel';
import { StoryStore } from './ui/story/story-store';
import { LocaleService } from './ui/i18n/locale-service';
import {
  ALL_MAP_LAYERS,
  MapLayers,
  situationWithLayers,
  trailsWithLayers,
} from './ui/map-view/map-layers';
import { MapView } from './ui/map-view/map-view';
import { toPlaceMarkers } from './ui/map-view/place-markers';
import { toSituationView } from './ui/map-view/situation-view';
import {
  sameUnitMarkers,
  toUnitMarkers,
  toUnitTrails,
  unitTransition,
} from './ui/map-view/unit-markers';
import { TimelineBar } from './ui/timeline/timeline-bar';
import { TimelineStore } from './ui/timeline/timeline-store';
import { UnitPanel } from './ui/units/unit-panel';

/** Wide enough that the open data notice leaves most of the map in view. */
const WIDE_SCREEN_QUERY = '(min-width: 1200px)';
/** A touch screen with no mouse or trackpad. */
const TOUCH_ONLY_QUERY = '(hover: none) and (pointer: coarse)';

@Component({
  imports: [EventPanel, LayerMenu, MapView, StoryPanel, TimelineBar, UnitPanel],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(LocaleService);
  protected readonly timeline = inject(TimelineStore);
  protected readonly story = inject(StoryStore);

  protected readonly cities = CITIES;
  /**
   * Below desktop width the data notice starts collapsed so that it does not cover the map; on a
   * wide screen it closes by itself once the reader starts the story or moves the timeline.
   */
  protected readonly noticeOpen = signal(
    typeof matchMedia !== 'function' || matchMedia(WIDE_SCREEN_QUERY).matches,
  );
  /** Touch screens are told about fingers, not the mouse buttons and wheel. */
  protected readonly touchOnly =
    typeof matchMedia === 'function' && matchMedia(TOUCH_ONLY_QUERY).matches;

  /** The units on the map at the timeline's current time. */
  protected readonly unitMarkers = computed(
    () =>
      toUnitMarkers(
        this.timeline.worldState(),
        this.timeline.scenario.units,
        this.timeline.selectedUnit()?.unit.id,
        {
          text: (text) => this.i18n.text(text),
          typeCharacter: this.i18n.messages().units.typeCharacter,
        },
      ),
    // Within a day the pieces stay the same; only hand the map a new list when they change.
    { equal: sameUnitMarkers },
  );

  /** Which overlays the reader has left switched on. */
  protected readonly layers = signal<MapLayers>(ALL_MAP_LAYERS);

  /** Where the units have been up to the current day; changes only when the date does. */
  private readonly allUnitTrails = computed(() =>
    toUnitTrails(this.timeline.scenario.units, this.timeline.calendarDay()),
  );
  protected readonly unitTrails = computed(() =>
    trailsWithLayers(this.allUnitTrails(), this.layers(), this.timeline.selectedUnit()?.unit.id),
  );
  protected readonly unitTransition = computed(() => unitTransition(this.timeline.timeline()));

  /**
   * The estimate for the evening of the current day. The world state is derived anew many times
   * a second while the timeline plays, but within one day it holds the same situation, so this
   * changes, and the map repaints its shading, only when the date does.
   */
  private readonly situation = computed(() => this.timeline.worldState().situation);
  /** Everything reached by the evening of the current day; also changes only with the date. */
  private readonly reach = computed(() =>
    reachedLine(this.timeline.scenario.situations, this.timeline.calendarDay()),
  );
  private readonly fullSituationView = computed(() =>
    toSituationView(this.situation(), this.reach(), this.i18n.messages().situation, (text) =>
      this.i18n.text(text),
    ),
  );
  protected readonly situationView = computed(() =>
    situationWithLayers(this.fullSituationView(), this.layers()),
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    // Only a notice that opened by itself closes by itself; one the reader opened stays open.
    if (this.noticeOpen()) this.closeNoticeOnceTheReaderStarts();
    // Each stop of the story turns the camera to where it happens, or back to the whole map.
    effect(() => {
      const stop = this.story.currentStop();
      if (!stop) return;
      this.selectedCityId.set(null);
      if (stop.camera) this.focusClear(stop.camera.target, stop.camera.distanceKm);
      else this.mapView().resetView();
    });
  }

  protected selectUnit(unitId: string): void {
    this.timeline.selectUnit(unitId);
    const marker = this.unitMarkers().find((unit) => unit.id === unitId);
    if (marker) this.revealAfterRender(marker.location);
  }

  protected selectCity(cityId: string): void {
    this.selectedCityId.set(cityId);
    const city = this.selectedCity();
    if (city) this.focusClear(city.location);
  }

  /** Jumps the timeline to an event and turns the camera to where it happened. */
  protected chooseEvent(event: HistoricalEvent): void {
    this.timeline.selectEvent(event);
    if (event.camera) this.focusClear(event.camera.target, event.camera.distanceKm);
    else this.mapView().resetView();
  }

  protected clearSelection(): void {
    this.selectedCityId.set(null);
  }

  protected resetView(): void {
    this.clearSelection();
    this.mapView().resetView();
  }

  /** Turns the camera to a place, then out from under any panel that opened with it. */
  private focusClear(location: GeographicLocation, distanceKm?: number): void {
    this.mapView().focusOn(location, distanceKm);
    this.revealAfterRender(location);
  }

  /** Waits for the panels of a new selection to be drawn, then moves the map clear of them. */
  private revealAfterRender(location: GeographicLocation): void {
    afterNextRender(
      () => {
        const panels = [...this.host.nativeElement.querySelectorAll('.panel')];
        this.mapView().revealLocation(location, panels);
      },
      { injector: this.injector },
    );
  }

  private closeNoticeOnceTheReaderStarts(): void {
    const startDay = untracked(this.timeline.calendarDay);
    const watch = effect(() => {
      const started =
        this.timeline.timeline().playing ||
        this.timeline.calendarDay() !== startDay ||
        this.story.active();
      if (!started) return;
      this.noticeOpen.set(false);
      watch.destroy();
    });
  }

  protected formatCoordinates({ location }: City): string {
    const latitude = `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? 'N' : 'S'}`;
    const longitude = `${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? 'E' : 'W'}`;
    return `${latitude}, ${longitude}`;
  }
}
