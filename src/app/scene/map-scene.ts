import type CameraControls from 'camera-controls';
import { Color, Material, Object3D, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { ElevationGrid } from '../core/geo/elevation-grid';
import { GeographicLocation } from '../core/geo/geo-types';
import { createMapControls, moveToInitialView } from './camera/map-controls';
import { CityMarker, createCityLayer } from './layers/city-layer';
import { createRiverLayer, SceneRiver } from './layers/river-layer';
import { KeyedLabelLayer } from './layers/keyed-label-layer';
import { createPlaceLayer, placeLabels, PlaceMarker } from './layers/place-layer';
import { createUnitLayer, unitLabels, UnitMarker } from './layers/unit-layer';
import { SCENE_CONFIG } from './scene-config';
import { createTerrainMesh } from './terrain/terrain-mesh';
import { createTerrainSurface, TerrainSurface } from './terrain/terrain-surface';
import { createTerrainTexture } from './terrain/terrain-texture';

/** Everything the scene draws. It is plain data: the scene never decides what is on the map. */
export interface MapSceneContent {
  readonly elevation: ElevationGrid;
  readonly rivers: readonly SceneRiver[];
  readonly cities: readonly CityMarker[];
}

export interface MapSceneEvents {
  onCitySelected(cityId: string): void;
  onUnitSelected(unitId: string): void;
}

const MAX_PIXEL_RATIO = 2;

/**
 * The 3D presentation of the map. It owns the three.js renderer, camera and layers, renders into
 * `host`, and exposes a small imperative API to the UI. It contains no history logic.
 */
export class MapScene {
  private readonly renderer: WebGLRenderer;
  private readonly labelRenderer = new CSS2DRenderer();
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly controls: CameraControls;
  private readonly surface: TerrainSurface;
  private readonly unitLayer: KeyedLabelLayer;
  private readonly placeLayer: KeyedLabelLayer;
  private readonly resizeObserver: ResizeObserver;

  private animationFrame = 0;
  private lastFrameTime = performance.now();
  private needsRender = true;

  constructor(
    private readonly host: HTMLElement,
    content: MapSceneContent,
    events: MapSceneEvents,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.scene.background = new Color(SCENE_CONFIG.backgroundColor);

    this.surface = createTerrainSurface(content.elevation, SCENE_CONFIG.verticalExaggeration);
    const mapSize = this.surface.projection.sizeKm;
    this.unitLayer = createUnitLayer(this.surface, (id) => events.onUnitSelected(id));
    this.placeLayer = createPlaceLayer(this.surface);
    this.scene.add(
      this.createTerrain(),
      createRiverLayer(content.rivers, this.surface),
      createCityLayer(content.cities, this.surface, (id) => events.onCitySelected(id)),
      this.unitLayer.object,
      this.placeLayer.object,
    );

    this.camera = new PerspectiveCamera(SCENE_CONFIG.camera.fieldOfViewDegrees, 1, 1, 6000);
    this.mountDomElements();
    this.resize();
    // Controls listen on the host so that drags starting on a label still move the map.
    this.controls = createMapControls(this.camera, host, mapSize);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.animationFrame = requestAnimationFrame(this.renderFrame);
  }

  /**
   * Smoothly centres the view on a place, keeping the current viewing angle. `distanceKm` is how
   * far the camera ends up from it; closer shows less of the map.
   */
  focusOn(
    location: GeographicLocation,
    distanceKm: number = SCENE_CONFIG.camera.focusDistance,
  ): void {
    const target = this.surface.positionAt(location);
    void this.controls.moveTo(target.x, 0, target.z, true);
    void this.controls.dollyTo(distanceKm, true);
  }

  /** Shows exactly these units, replacing whatever was shown before. */
  setUnits(markers: readonly UnitMarker[]): void {
    this.unitLayer.update(unitLabels(markers));
    this.needsRender = true;
  }

  /** Points out exactly these places, replacing whatever was highlighted before. */
  setPlaces(markers: readonly PlaceMarker[]): void {
    this.placeLayer.update(placeLabels(markers));
    this.needsRender = true;
  }

  resetView(): void {
    moveToInitialView(this.controls, this.camera, this.surface.projection.sizeKm, true);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.scene.traverse(disposeObject);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
    delete this.host.dataset['zoom'];
  }

  private createTerrain(): Object3D {
    const { grid, projection } = this.surface;
    const colorMap = createTerrainTexture(grid, {
      cellSizeMeters: {
        eastWest: (projection.sizeKm.width * 1000) / (grid.width - 1),
        northSouth: (projection.sizeKm.depth * 1000) / (grid.height - 1),
      },
      reliefStrength: SCENE_CONFIG.hillshadeStrength,
    });
    colorMap.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return createTerrainMesh(this.surface, colorMap, {
      columns: SCENE_CONFIG.terrainMeshColumns,
      baseDepth: SCENE_CONFIG.baseDepth,
    });
  }

  private mountDomElements(): void {
    const labels = this.labelRenderer.domElement;
    labels.classList.add('map-labels');
    this.host.append(this.renderer.domElement, labels);
  }

  private resize(): void {
    const { clientWidth: width, clientHeight: height } = this.host;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
  }

  /** Renders only when the camera moved or something was invalidated, to stay idle otherwise. */
  private readonly renderFrame = (time: number): void => {
    this.animationFrame = requestAnimationFrame(this.renderFrame);
    const deltaSeconds = (time - this.lastFrameTime) / 1000;
    this.lastFrameTime = time;

    const cameraMoved = this.controls.update(deltaSeconds);
    if (!cameraMoved && !this.needsRender) return;
    this.needsRender = false;

    this.host.dataset['zoom'] =
      this.controls.distance > SCENE_CONFIG.minorLabelMaxDistance ? 'far' : 'near';
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };
}

function disposeObject(object: Object3D): void {
  const { geometry, material } = object as Partial<{
    geometry: { dispose(): void };
    material: Material | Material[];
  }>;
  geometry?.dispose();
  for (const item of [material ?? []].flat()) {
    (item as Material & { map?: Texture | null }).map?.dispose();
    item.dispose();
  }
}
