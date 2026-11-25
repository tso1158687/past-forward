import CameraControls from 'camera-controls';
import {
  Box3,
  MathUtils,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { SCENE_CONFIG } from '../scene-config';

// camera-controls only needs this subset of three.js, which keeps the rest tree-shakeable.
CameraControls.install({
  THREE: { Box3, Matrix4, Quaternion, Raycaster, Sphere, Spherical, Vector2, Vector3, Vector4 },
});

const { camera: CAMERA } = SCENE_CONFIG;

interface MapSize {
  readonly width: number;
  readonly depth: number;
}

/**
 * Map-style camera controls: drag to pan along the ground, right-drag (or two fingers) to rotate
 * and tilt, wheel/pinch to zoom towards the pointer. The camera target is confined to the map.
 */
export function createMapControls(
  camera: PerspectiveCamera,
  domElement: HTMLElement,
  mapSize: MapSize,
): CameraControls {
  const controls = new CameraControls(camera, domElement);

  // SCREEN_PAN moves along the ground: a vertical drag pushes the map away or pulls it closer.
  controls.mouseButtons.left = CameraControls.ACTION.SCREEN_PAN;
  controls.mouseButtons.right = CameraControls.ACTION.ROTATE;
  controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
  controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
  controls.touches.one = CameraControls.ACTION.TOUCH_SCREEN_PAN;
  controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_ROTATE;
  controls.dollyToCursor = true;

  controls.minDistance = CAMERA.minDistance;
  controls.maxDistance = CAMERA.maxDistance;
  controls.maxPolarAngle = MathUtils.degToRad(CAMERA.maxPolarDegrees);
  controls.setBoundary(
    new Box3(
      new Vector3(-mapSize.width / 2, 0, -mapSize.depth / 2),
      new Vector3(mapSize.width / 2, 0, mapSize.depth / 2),
    ),
  );

  moveToInitialView(controls, camera, mapSize, domElement.clientWidth, false);
  return controls;
}

/**
 * Looks north across the whole map from the south, at a distance that fits the viewport. A
 * portrait tablet shows the whole width of the map, its near edge included, and may pull back
 * beyond the usual limit to do so; a phone keeps a closer view that crops the sides.
 */
export function moveToInitialView(
  controls: CameraControls,
  camera: PerspectiveCamera,
  mapSize: MapSize,
  viewportWidthPixels: number,
  animate: boolean,
): void {
  const polar = MathUtils.degToRad(CAMERA.initialPolarDegrees);
  const wholeWidth = camera.aspect < 1 && viewportWidthPixels >= CAMERA.wholeWidthMinPixels;
  const distance = wholeWidth
    ? wholeWidthDistance(camera, mapSize, polar)
    : Math.min(fitDistance(camera, mapSize, polar), CAMERA.maxDistance);
  controls.maxDistance = Math.max(CAMERA.maxDistance, distance);
  controls.normalizeRotations();
  void controls.setLookAt(
    0,
    distance * Math.cos(polar),
    distance * Math.sin(polar),
    0,
    0,
    0,
    animate,
  );
}

/** Camera distance at which the tilted map fills the viewport in its tighter dimension. */
function fitDistance(camera: PerspectiveCamera, mapSize: MapSize, polar: number): number {
  const verticalHalfTan = Math.tan(MathUtils.degToRad(camera.fov) / 2);
  const widthFit = mapSize.width / 2 / (verticalHalfTan * camera.aspect);
  const depthFit = (mapSize.depth * Math.cos(polar)) / 2 / verticalHalfTan;
  return Math.max(widthFit, depthFit) * CAMERA.initialFitMargin;
}

/**
 * Camera distance at which even the near (southern) edge of the tilted map, which is closer to
 * the camera than the centre and so looks wider, fits across the viewport.
 */
function wholeWidthDistance(camera: PerspectiveCamera, mapSize: MapSize, polar: number): number {
  const verticalHalfTan = Math.tan(MathUtils.degToRad(camera.fov) / 2);
  const nearEdgeFit =
    mapSize.width / 2 / (verticalHalfTan * camera.aspect) + (mapSize.depth / 2) * Math.sin(polar);
  return Math.max(nearEdgeFit * CAMERA.initialFitMargin, fitDistance(camera, mapSize, polar));
}
