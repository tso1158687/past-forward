import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { GeographicLocation } from '../../core/geo/geo-types';
import { HistoricalBorder } from '../../core/history/scenario';
import { City } from '../../data/map/cities';
import { loadMapAssets, MapAssets } from '../../data/map/map-assets';
import { RIVER_NAMES } from '../../data/map/river-names';
import type { PlaceMarker } from '../../scene/layers/place-layer';
import type { UnitMarker, UnitTrail, UnitTransition } from '../../scene/layers/unit-layer';
import type { MapScene, MapSceneContent } from '../../scene/map-scene';
import { LocaleService } from '../i18n/locale-service';

type MapStatus = 'loading' | 'ready' | 'failed';

/**
 * Hosts the 3D map. It turns app data into the plain content the scene draws and forwards scene
 * events as Angular outputs; the scene itself knows nothing about Angular.
 */
@Component({
  selector: 'app-map-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map-view.html',
  styleUrl: './map-view.css',
})
export class MapView {
  readonly cities = input.required<readonly City[]>();
  /** Borders to draw; the course of each comes from the map assets. */
  readonly borders = input<readonly HistoricalBorder[]>([]);
  /** Units to show right now. */
  readonly units = input<readonly UnitMarker[]>([]);
  /** Where the units have been so far. */
  readonly unitTrails = input<readonly UnitTrail[]>([]);
  /** How units get to a new location when `units` changes. */
  readonly unitTransition = input<UnitTransition>({ seconds: 0, easing: 'eased' });
  /** Places to point out, such as where the selected event happened. */
  readonly places = input<readonly PlaceMarker[]>([]);
  readonly citySelected = output<string>();
  readonly unitSelected = output<string>();

  protected readonly i18n = inject(LocaleService);
  protected readonly status = signal<MapStatus>('loading');

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private scene?: MapScene;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.createScene());
    effect(() => {
      // Read the input before the optional call: while the scene is still loading, `?.` would
      // skip the read and the effect would never learn that it depends on `units`.
      const units = this.units();
      const trails = this.unitTrails();
      // How to get there is read at the moment of the change; it must not cause one itself.
      const transition = untracked(this.unitTransition);
      this.scene?.setUnits(units, trails, transition);
    });
    effect(() => {
      const places = this.places();
      this.scene?.setPlaces(places);
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.scene?.dispose();
    });
  }

  focusOn(location: GeographicLocation, distanceKm?: number): void {
    this.scene?.focusOn(location, distanceKm);
  }

  resetView(): void {
    this.scene?.resetView();
  }

  private async createScene(): Promise<void> {
    try {
      // three.js is loaded on demand so it stays out of the initial bundle.
      const [assets, { MapScene }] = await Promise.all([
        loadMapAssets(),
        import('../../scene/map-scene'),
      ]);
      if (this.destroyed) return;
      this.scene = new MapScene(this.host().nativeElement, this.toSceneContent(assets), {
        onCitySelected: (cityId) => this.citySelected.emit(cityId),
        onUnitSelected: (unitId) => this.unitSelected.emit(unitId),
      });
      // The effects above could not reach the scene while it was still loading.
      this.scene.setUnits(this.units(), this.unitTrails(), { seconds: 0, easing: 'eased' });
      this.scene.setPlaces(this.places());
      this.status.set('ready');
    } catch (error) {
      console.error('Map failed to initialise', error);
      this.status.set('failed');
    }
  }

  private toSceneContent(assets: MapAssets): MapSceneContent {
    return {
      elevation: assets.elevation,
      rivers: assets.rivers.map((river) => {
        const name = RIVER_NAMES[river.name];
        return { ...river, label: name ? this.i18n.text(name) : undefined };
      }),
      borders: this.borders().map((border) => {
        const course = assets.borders.find((line) => line.id === border.id);
        if (!course) throw new Error(`The map assets have no border "${border.id}"`);
        return { lines: course.lines, label: this.i18n.text(border.name) };
      }),
      cities: this.cities().map((city) => ({
        id: city.id,
        label: this.i18n.text(city.name),
        location: city.location,
        rank: city.rank,
      })),
    };
  }
}
