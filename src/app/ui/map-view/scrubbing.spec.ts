import { Mesh, Object3D, PlaneGeometry } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrontSituation, reachedLine } from '../../core/history/front-situation';
import { deriveWorldState } from '../../core/history/world-state';
import { LocalizedText } from '../../core/i18n/localized-text';
import { displayedDay } from '../../core/timeline/timeline-state';
import { MINSK_SCENARIO } from '../../data/scenarios/minsk-1941/scenario';
import { SituationLayer } from '../../scene/layers/situation-layer';
import { UnitLayer, UnitMarker } from '../../scene/layers/unit-layer';
import { createTerrainSurface } from '../../scene/terrain/terrain-surface';
import { MESSAGES_ZH_TW } from '../i18n/messages.zh-TW';
import { toSituationView } from './situation-view';
import { sameUnitMarkers, toUnitMarkers, toUnitTrails, unitTransition } from './unit-markers';

/*
 * Milestone 5: whatever way the reader moves through time (playing, dragging back, jumping, being
 * interrupted halfway through a slide or a fade), once the map comes to rest it must show exactly
 * what it shows after a single jump to the same moment. This drives the real layers with the same
 * derivations the app uses, from the real scenario.
 */

const scenario = MINSK_SCENARIO;
const lastDay = scenario.timeRange.endDay;
const surface = createTerrainSurface(
  {
    bounds: { west: 19.5, east: 31.5, south: 50.5, north: 56 },
    width: 2,
    height: 2,
    metersPerUnit: 1,
    samples: new Int16Array(4),
  },
  1,
);
const text = (value: LocalizedText) => value['zh-TW'];
const markerText = { text, typeCharacter: MESSAGES_ZH_TW.units.typeCharacter };

interface Playback {
  readonly playing: boolean;
  readonly daysPerSecond: number;
}

/** The two layers that change with time, fed the way the app and the map view feed them. */
class TimedLayers {
  readonly units = new UnitLayer(surface);
  readonly situation = new SituationLayer(surface, new PlaneGeometry());
  private markers: readonly UnitMarker[] = [];
  private calendarDay = Number.NaN;
  private frontSituation: FrontSituation | undefined;
  private started = false;

  show(day: number, playback: Playback): void {
    const world = deriveWorldState(scenario, day);
    const calendarDay = displayedDay({ range: scenario.timeRange, currentDay: day });
    const markers = toUnitMarkers(world, scenario.units, undefined, markerText);
    const transition = unitTransition(playback);
    // The app hands the map new pieces only when they change, and new trails when the date does.
    if (
      !this.started ||
      !sameUnitMarkers(this.markers, markers) ||
      calendarDay !== this.calendarDay
    ) {
      this.units.update(markers, toUnitTrails(scenario.units, calendarDay), transition);
    }
    if (!this.started || world.situation !== this.frontSituation) {
      const reach = reachedLine(scenario.situations, calendarDay);
      const view = toSituationView(world.situation, reach, MESSAGES_ZH_TW.situation, text);
      this.situation.update(view, transition.seconds);
    }
    this.markers = markers;
    this.calendarDay = calendarDay;
    this.frontSituation = world.situation;
    this.started = true;
  }

  animate(seconds: number): boolean {
    const units = this.units.animate(seconds);
    const situation = this.situation.animate(seconds);
    return units || situation;
  }

  settle(): void {
    for (let frame = 0; frame < 10_000; frame++) {
      if (!this.animate(1 / 60)) return;
    }
    throw new Error('The map never came to rest');
  }

  /** Everything on screen, in a form two maps can be compared by. */
  snapshot(): string[] {
    return [...describe3D(this.units.object), ...describe3D(this.situation.object)].sort();
  }
}

function describe3D(root: Object3D): string[] {
  const lines: string[] = [];
  root.traverse((node) => {
    if (!node.visible) return;
    const parts: unknown[] = [
      node.type,
      round(node.position.toArray()),
      round(node.scale.toArray()),
    ];
    if (node instanceof CSS2DObject) {
      const { element } = node;
      parts.push(element.className, element.textContent, element.title, { ...element.dataset });
    }
    if (node instanceof LineSegments2) {
      parts.push(round(Array.from(node.geometry.attributes['instanceStart'].array)));
    }
    if (node instanceof Mesh && !Array.isArray(node.material)) {
      const { opacity, map } = node.material as { opacity: number; map?: { image?: unknown } };
      parts.push(round([opacity]));
      if (map?.image instanceof HTMLCanvasElement) parts.push(drawingOf(map.image));
    }
    lines.push(JSON.stringify(parts));
  });
  return lines;
}

function round(values: number[]): number[] {
  return values.map((value) => Math.round(value * 1000) / 1000 || 0);
}

/*
 * jsdom has no 2D canvas. The stand-in records every drawing call since the canvas was last
 * cleared, so that two canvases can be compared by what was drawn on them.
 */
const drawings = new WeakMap<HTMLCanvasElement, string[]>();
const contexts = new WeakMap<HTMLCanvasElement, object>();

function drawingOf(canvas: HTMLCanvasElement): string {
  return (drawings.get(canvas) ?? []).join(';');
}

function recordingContext(canvas: HTMLCanvasElement): object {
  const existing = contexts.get(canvas);
  if (existing) return existing;
  const log: string[] = [];
  drawings.set(canvas, log);
  const format = (value: unknown) =>
    typeof value === 'number' ? String(Math.round(value * 1000) / 1000) : typeof value;
  const state: Record<string | symbol, unknown> = { canvas };
  const context = new Proxy(state, {
    get(target, property) {
      if (property in target) return target[property];
      return (...args: unknown[]) => {
        if (property === 'clearRect') log.length = 0;
        log.push(`${String(property)}(${args.map(format).join(',')})`);
        if (property === 'createPattern') return {};
        if (property === 'measureText') return { width: 0 };
        return undefined;
      };
    },
    set(target, property, value) {
      target[property] = value;
      log.push(`${String(property)}=${typeof value === 'object' ? 'object' : String(value)}`);
      return true;
    },
  });
  contexts.set(canvas, context);
  return context;
}

/** A small deterministic generator, so that a failure can be replayed. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

describe('moving through time', () => {
  beforeEach(() => {
    const getContext = function (this: HTMLCanvasElement) {
      return recordingContext(this);
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      getContext as unknown as HTMLCanvasElement['getContext'],
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('comes to rest on what a direct jump to the same moment shows, whatever came before', () => {
    const random = seededRandom(1941);
    const speeds = [0.5, 1, 2, 4];
    for (let walk = 0; walk < 12; walk++) {
      const scrubbed = new TimedLayers();
      let day = 0;
      for (let step = 0; step < 14; step++) {
        const playing = random() < 0.5;
        // Playback creeps forward; a drag or a click on an event can go anywhere, back included.
        day = playing
          ? Math.min(lastDay, day + random() * 0.8)
          : Math.floor(random() * (lastDay + 1) * 4) / 4;
        scrubbed.show(day, { playing, daysPerSecond: speeds[Math.floor(random() * 4)] });
        // Often cut short, halfway through a slide or a fade.
        scrubbed.animate(random() * 0.6);
      }
      scrubbed.settle();

      const direct = new TimedLayers();
      direct.show(day, { playing: false, daysPerSecond: 1 });
      direct.settle();

      expect(scrubbed.snapshot(), `walk ${walk}, ending on day ${day}`).toEqual(direct.snapshot());
    }
  });

  it('shows the same pieces and shading going back to a day as when first reaching it', () => {
    const layers = new TimedLayers();
    const visits: Record<number, string[]> = {};
    for (const day of [0, 3, 6.5, 11, 17, 11, 6.5, 3, 0]) {
      layers.show(day, { playing: false, daysPerSecond: 1 });
      layers.settle();
      const seen = layers.snapshot();
      if (visits[day]) expect(seen, `back on day ${day}`).toEqual(visits[day]);
      else visits[day] = seen;
    }
  });
});
