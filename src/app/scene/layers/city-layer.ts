import { Group } from 'three';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel } from './label';

export interface CityMarker {
  readonly id: string;
  readonly label: string;
  readonly location: GeographicLocation;
  /** 1 = major city, always labelled; 3 = minor place, labelled only when zoomed in. */
  readonly rank: 1 | 2 | 3;
}

/** A press that moves further than this is a map drag, not a click on the label. */
const CLICK_TOLERANCE_PIXELS = 5;

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

/**
 * Panning keeps the label under the pointer, so a plain `click` listener would also fire at the
 * end of a drag that started on a label.
 */
function onClickWithoutDrag(element: HTMLElement, handler: () => void): void {
  let pressX = 0;
  let pressY = 0;
  element.addEventListener('pointerdown', (event) => {
    pressX = event.clientX;
    pressY = event.clientY;
  });
  element.addEventListener('click', (event) => {
    const moved = Math.hypot(event.clientX - pressX, event.clientY - pressY);
    if (moved <= CLICK_TOLERANCE_PIXELS) handler();
  });
}
