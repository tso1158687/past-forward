import { fromPlanarResiduals } from './terrain-encoding';

/** The encoder of tools/bake-map-data.mjs, restated so that the two are checked against each other. */
function toPlanarResiduals(samples: Int16Array, width: number, height: number): Int16Array {
  const residuals = new Int16Array(samples.length);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = row * width + col;
      const west = col > 0 ? samples[i - 1] : 0;
      const north = row > 0 ? samples[i - width] : 0;
      const northWest = col > 0 && row > 0 ? samples[i - width - 1] : 0;
      residuals[i] = samples[i] - (west + north - northWest);
    }
  }
  return residuals;
}

describe('fromPlanarResiduals', () => {
  it('restores every sample of a grid exactly', () => {
    const width = 5;
    const height = 4;
    const samples = Int16Array.from(
      { length: width * height },
      (_, i) => 120 + ((i * 37) % 61) - 30,
    );
    expect(fromPlanarResiduals(toPlanarResiduals(samples, width, height), width, height)).toEqual(
      samples,
    );
  });

  it('restores extreme heights whose residuals wrap around', () => {
    const samples = Int16Array.from([32767, -32768, -32768, 32767]);
    expect(fromPlanarResiduals(toPlanarResiduals(samples, 2, 2), 2, 2)).toEqual(samples);
  });
});
