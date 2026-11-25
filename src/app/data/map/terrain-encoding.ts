/** The only terrain.bin encoding this app reads; tools/bake-map-data.mjs writes it. */
export const TERRAIN_ENCODING = 'planar-residual-int16-gzip';

/**
 * Turns terrain.bin back into elevation samples. The file is gzipped; inside, each Int16 is the
 * difference between a sample and the prediction from its west, north and north-west neighbours
 * (west + north - north-west), row by row from the north-west corner.
 */
export async function decodeTerrain(
  file: ArrayBuffer,
  width: number,
  height: number,
): Promise<Int16Array> {
  const bytes = await new Response(
    new Blob([file]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).arrayBuffer();
  if (bytes.byteLength !== width * height * Int16Array.BYTES_PER_ELEMENT) {
    throw new Error('terrain.bin does not match the size declared in terrain.json');
  }
  return fromPlanarResiduals(new Int16Array(bytes), width, height);
}

/** Undoes the prediction step; Int16 arithmetic wraps exactly as it did when encoding. */
export function fromPlanarResiduals(
  residuals: Int16Array,
  width: number,
  height: number,
): Int16Array {
  const samples = new Int16Array(residuals.length);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = row * width + col;
      const west = col > 0 ? samples[i - 1] : 0;
      const north = row > 0 ? samples[i - width] : 0;
      const northWest = col > 0 && row > 0 ? samples[i - width - 1] : 0;
      samples[i] = residuals[i] + west + north - northWest;
    }
  }
  return samples;
}
