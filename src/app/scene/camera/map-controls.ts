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

  controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
  controls.mouseButtons.right = CameraControls.ACTION.ROTATE;
  controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
  controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
  controls.touches.one = CameraControls.ACTION.TOUCH_TRUCK;
  controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_ROTATE;
  controls.verticalDragToForward = true;
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

  moveToInitialView(controls, camera, mapSize, false);
  return controls;
}

/** Looks north across the whole map from the south, at a distance that fits the viewport. */
export function moveToInitialView(
  controls: CameraControls,
  camera: PerspectiveCamera,
  mapSize: MapSize,
  animate: boolean,
): void {
  const polar = MathUtils.degToRad(CAMERA.initialPolarDegrees);
  const distance = Math.min(fitDistance(camera, mapSize, polar), CAMERA.maxDistance);
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
