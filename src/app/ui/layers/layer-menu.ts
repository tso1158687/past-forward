import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { LocaleService } from '../i18n/locale-service';
import { MapLayer, MapLayers } from '../map-view/map-layers';

/** The "layers" menu beside the reset button: switches map overlays on and off. */
@Component({
  selector: 'app-layer-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layer-menu.html',
  styleUrl: './layer-menu.css',
})
export class LayerMenu {
  readonly layers = model.required<MapLayers>();

  protected readonly i18n = inject(LocaleService);
  protected readonly choices: readonly MapLayer[] = ['front', 'arrows', 'trails'];

  protected set(layer: MapLayer, shown: boolean): void {
    this.layers.update((layers) => ({ ...layers, [layer]: shown }));
  }
}
