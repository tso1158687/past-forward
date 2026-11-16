import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  readonly citySelected = output<string>();

  protected readonly i18n = inject(LocaleService);
  protected readonly status = signal<MapStatus>('loading');

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private scene?: MapScene;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.createScene());
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.scene?.dispose();
    });
  }

  focusOn(location: GeographicLocation): void {
    this.scene?.focusOn(location);
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
