import { Group } from 'three';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel, onClickWithoutDrag } from './label';

export interface CityMarker {
  readonly id: string;
  readonly label: string;
  readonly location: GeographicLocation;
  /** 1 = major city, always labelled; 3 = minor place, labelled only when zoomed in. */
  readonly rank: 1 | 2 | 3;
}

export function createCityLayer(
  cities: readonly CityMarker[],
  surface: TerrainSurface,
  onSelect: (cityId: string) => void,
): Group {
  const group = new Group();
  for (const city of cities) {
    const label = createLabel('city-label', city.label);
    label.element.dataset['rank'] = String(city.rank);
    // Anchor the label by its left edge, where the dot is drawn.
    label.center.set(0, 0.5);
    label.position.copy(surface.positionAt(city.location));
    onClickWithoutDrag(label.element, () => onSelect(city.id));
    group.add(label);
  }
  return group;
}
