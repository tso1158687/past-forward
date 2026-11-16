import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CITIES, City } from './data/map/cities';
import { LocaleService } from './ui/i18n/locale-service';
import { MapView } from './ui/map-view/map-view';

const WIDE_SCREEN_QUERY = '(min-width: 721px)';

@Component({
  imports: [MapView],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(LocaleService);
  protected readonly cities = CITIES;
  /** On narrow screens the data notice starts collapsed so that it does not cover the map. */
  protected readonly noticeInitiallyOpen =
    typeof matchMedia !== 'function' || matchMedia(WIDE_SCREEN_QUERY).matches;

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
