import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Texture,
} from 'three';
import { GeographicLocation } from '../../core/geo/geo-types';
import { TerrainSurface } from './terrain-surface';

const SKIRT_COLOR = '#2b2723';

interface TerrainMeshOptions {
  readonly columns: number;
  readonly baseDepth: number;
}

/** The relief surface plus a dark skirt around its edges, so the map reads as a solid sand table. */
export function createTerrainMesh(
  surface: TerrainSurface,
  colorMap: Texture,
  options: TerrainMeshOptions,
): Group {
  const { grid } = surface;
  const columns = options.columns;
  const rows = Math.round((columns * grid.height) / grid.width);

  const group = new Group();
  group.add(
    new Mesh(
      buildSurfaceGeometry(surface, columns, rows),
      new MeshBasicMaterial({ map: colorMap }),
    ),
    new Mesh(
      buildSkirtGeometry(surface, columns, rows, options.baseDepth),
      new MeshBasicMaterial({ color: SKIRT_COLOR, side: DoubleSide }),
    ),
  );
  return group;
}

/** Location of a mesh vertex; (0, 0) is the north-west corner. */
function vertexLocation(
  surface: TerrainSurface,
  column: number,
  row: number,
  columns: number,
  rows: number,
): GeographicLocation {
  const { west, east, south, north } = surface.grid.bounds;
  return {
    lon: west + (column / columns) * (east - west),
    lat: north - (row / rows) * (north - south),
  };
}

function buildSurfaceGeometry(
  surface: TerrainSurface,
  columns: number,
  rows: number,
): BufferGeometry {
  const { width, height } = surface.grid;
  const vertexCount = (columns + 1) * (rows + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const index = row * (columns + 1) + column;
      const position = surface.positionAt(vertexLocation(surface, column, row, columns, rows));
      position.toArray(positions, index * 3);
      // Texel centres sit on the elevation grid nodes, hence the half-texel offset.
      uvs[index * 2] = ((column / columns) * (width - 1) + 0.5) / width;
      uvs[index * 2 + 1] = ((row / rows) * (height - 1) + 0.5) / height;
    }
  }

  const indices = new Uint32Array(columns * rows * 6);
  let cursor = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const northWest = row * (columns + 1) + column;
      const northEast = northWest + 1;
      const southWest = northWest + columns + 1;
      const southEast = southWest + 1;
      // Counter-clockwise when seen from above.
      indices.set([northWest, southWest, northEast, southWest, southEast, northEast], cursor);
      cursor += 6;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}

/** A vertical ribbon from the terrain edge down to the base, following the perimeter. */
function buildSkirtGeometry(
  surface: TerrainSurface,
  columns: number,
  rows: number,
  baseDepth: number,
): BufferGeometry {
  const perimeter: GeographicLocation[] = [];
  const add = (column: number, row: number) =>
    perimeter.push(vertexLocation(surface, column, row, columns, rows));
  for (let column = 0; column < columns; column++) add(column, 0);
  for (let row = 0; row < rows; row++) add(columns, row);
  for (let column = columns; column > 0; column--) add(column, rows);
  for (let row = rows; row > 0; row--) add(0, row);

  // Two vertices per perimeter point: the terrain edge and the point straight below it.
  const positions = new Float32Array(perimeter.length * 2 * 3);
  perimeter.forEach((location, i) => {
    const top = surface.positionAt(location);
    top.toArray(positions, i * 6);
    positions.set([top.x, -baseDepth, top.z], i * 6 + 3);
  });

  const indices = new Uint32Array(perimeter.length * 6);
  for (let i = 0; i < perimeter.length; i++) {
    const top = i * 2;
    const nextTop = ((i + 1) % perimeter.length) * 2;
    indices.set([top, top + 1, nextTop, top + 1, nextTop + 1, nextTop], i * 6);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}
