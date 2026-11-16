import { Group } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel } from './label';

/** A unit to draw right now. The scene is told where units are; it never works that out itself. */
export interface UnitMarker {
  readonly id: string;
  readonly label: string;
  readonly location: GeographicLocation;
  /** True when the location is an in-between estimate rather than a stated position. */
  readonly interpolated: boolean;
}

/**
 * Keeps one label per visible unit and moves it as the markers change. Labels are reused by unit
 * id because this is updated on every frame while the timeline plays.
 */
export class UnitLayer {
  readonly object = new Group();
  private readonly labels = new Map<string, CSS2DObject>();

  constructor(private readonly surface: TerrainSurface) {}

  update(markers: readonly UnitMarker[]): void {
    const visibleIds = new Set<string>();
    for (const marker of markers) {
      visibleIds.add(marker.id);
      const label = this.labels.get(marker.id) ?? this.addLabel(marker.id);
      label.element.textContent = marker.label;
      label.element.dataset['basis'] = marker.interpolated ? 'interpolated' : 'anchor';
      label.position.copy(this.surface.positionAt(marker.location));
    }

    for (const [id, label] of this.labels) {
      if (visibleIds.has(id)) continue;
      this.object.remove(label);
      this.labels.delete(id);
    }
  }

  private addLabel(id: string): CSS2DObject {
    const label = createLabel('unit-marker', '');
    this.labels.set(id, label);
    this.object.add(label);
    return label;
  }
}
