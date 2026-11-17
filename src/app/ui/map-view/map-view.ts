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
  viewChild,
} from '@angular/core';
import { GeographicLocation } from '../../core/geo/geo-types';
import { City } from '../../data/map/cities';
import { loadMapAssets, MapAssets } from '../../data/map/map-assets';
import { RIVER_NAMES } from '../../data/map/river-names';
import type { PlaceMarker } from '../../scene/layers/place-layer';
import type { UnitMarker } from '../../scene/layers/unit-layer';
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
  /** Units to show right now; expected to change on every frame while the timeline plays. */
  readonly units = input<readonly UnitMarker[]>([]);
  /** Places to point out, such as where the selected event happened. */
  readonly places = input<readonly PlaceMarker[]>([]);
  readonly citySelected = output<string>();

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
      this.scene?.setUnits(units);
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
      });
      // The effects above could not reach the scene while it was still loading.
      this.scene.setUnits(this.units());
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
      cities: this.cities().map((city) => ({
        id: city.id,
        label: this.i18n.text(city.name),
        location: city.location,
        rank: city.rank,
      })),
    };
  }
}
