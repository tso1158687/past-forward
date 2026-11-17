import { Group } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from '../terrain/terrain-surface';
import { createLabel, setLabelText } from './label';

/** One label to show right now. */
export interface KeyedLabel {
  readonly id: string;
  readonly text: string;
  readonly location: GeographicLocation;
  /** Written to the element as `data-*` attributes, for styling variants. */
  readonly data?: Readonly<Record<string, string>>;
}

interface KeyedLabelLayerOptions {
  /** CSS class of every label in the layer; see map-labels.css. */
  readonly className: string;
  /**
   * Which point of the label sits on the location, as fractions of its width and height.
   * Defaults to the centre.
   */
  readonly anchor?: readonly [x: number, y: number];
}

/**
 * A set of labels that changes over time. Each update states the complete set to show; labels are
 * matched by id and reused, because some layers are updated on every frame during playback.
 */
export class KeyedLabelLayer {
  readonly object = new Group();
  private readonly labels = new Map<string, CSS2DObject>();

  constructor(
    private readonly surface: TerrainSurface,
    private readonly options: KeyedLabelLayerOptions,
  ) {}

  update(items: readonly KeyedLabel[]): void {
    const shownIds = new Set<string>();
    for (const item of items) {
      shownIds.add(item.id);
      const label = this.labels.get(item.id) ?? this.addLabel(item.id);
      setLabelText(label, item.text);
      for (const [key, value] of Object.entries(item.data ?? {})) {
        label.element.dataset[key] = value;
      }
      label.position.copy(this.surface.positionAt(item.location));
    }

    for (const [id, label] of this.labels) {
      if (shownIds.has(id)) continue;
      this.object.remove(label);
      this.labels.delete(id);
    }
  }

  private addLabel(id: string): CSS2DObject {
    const label = createLabel(this.options.className, '');
    if (this.options.anchor) label.center.set(...this.options.anchor);
    this.labels.set(id, label);
    this.object.add(label);
    return label;
  }
}
