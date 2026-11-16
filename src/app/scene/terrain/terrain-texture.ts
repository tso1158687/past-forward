import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  SRGBColorSpace,
} from 'three';
import { ElevationGrid } from '../../core/geo/elevation-grid';
import { isSea, terrainColor } from './terrain-palette';

interface HillshadeOptions {
  /** Ground distance between neighbouring samples, in metres. */
  readonly cellSizeMeters: { readonly eastWest: number; readonly northSouth: number };
  /** Slope multiplier; higher values make gentle relief more visible. */
  readonly reliefStrength: number;
}

/** Light from the north-west, 45° above the horizon – the cartographic convention. */
const LIGHT = normalize([-1, 1, Math.SQRT2]);
const FLAT_GROUND_LIGHT = LIGHT[2];
const MIN_SHADE = 0.5;
const MAX_SHADE = 1.3;

/**
 * Paints the terrain colour map: hypsometric tint multiplied by hillshade. The shading is baked
 * into the texture so the relief reads the same from every camera angle.
 */
export function createTerrainTexture(grid: ElevationGrid, options: HillshadeOptions): DataTexture {
  const { width, height } = grid;
  const pixels = new Uint8Array(width * height * 4);
  const metersAt = (column: number, row: number) =>
    grid.samples[clampIndex(row, height) * width + clampIndex(column, width)] * grid.metersPerUnit;

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const meters = metersAt(column, row);
      const color = terrainColor(meters);
      const shade = isSea(meters)
        ? 1
        : hillshade(
            (metersAt(column + 1, row) - metersAt(column - 1, row)) /
              (2 * options.cellSizeMeters.eastWest),
            // Row 0 is north, so the previous row is the northern neighbour.
            (metersAt(column, row - 1) - metersAt(column, row + 1)) /
              (2 * options.cellSizeMeters.northSouth),
            options.reliefStrength,
          );
      const offset = (row * width + column) * 4;
      pixels[offset] = Math.min(255, color[0] * shade);
      pixels[offset + 1] = Math.min(255, color[1] * shade);
      pixels[offset + 2] = Math.min(255, color[2] * shade);
      pixels[offset + 3] = 255;
    }
  }

  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Brightness factor for a slope (rise per metre towards east / north); 1 means flat ground. */
function hillshade(slopeEast: number, slopeNorth: number, reliefStrength: number): number {
  const normal = normalize([-slopeEast * reliefStrength, -slopeNorth * reliefStrength, 1]);
  const light = normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2];
  return Math.min(Math.max(light / FLAT_GROUND_LIGHT, MIN_SHADE), MAX_SHADE);
}

function normalize(vector: [number, number, number]): [number, number, number] {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function clampIndex(index: number, size: number): number {
  return Math.min(Math.max(index, 0), size - 1);
}
