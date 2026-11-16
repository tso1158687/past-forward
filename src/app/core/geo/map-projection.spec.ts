import { GeoBounds, GeographicLocation } from './geo-types';
import { createMapProjection } from './map-projection';

const BOUNDS: GeoBounds = { west: 19.5, east: 31.5, south: 50.5, north: 56 };
const BREST: GeographicLocation = { lon: 23.69, lat: 52.1 };
const MINSK: GeographicLocation = { lon: 27.56, lat: 53.9 };

/** Independent reference: great-circle distance on a sphere. */
function haversineKm(a: GeographicLocation, b: GeographicLocation): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

describe('createMapProjection', () => {
  const projection = createMapProjection(BOUNDS);

  it('puts the centre of the bounds at the origin', () => {
    const origin = projection.project({ lon: 25.5, lat: 53.25 });
    expect(origin.x).toBeCloseTo(0);
    expect(origin.z).toBeCloseTo(0);
  });

  it('maps east to +x and north to -z', () => {
    expect(projection.project({ lon: 30, lat: 53.25 }).x).toBeGreaterThan(0);
    expect(projection.project({ lon: 25.5, lat: 55 }).z).toBeLessThan(0);
  });

  it('round-trips through unproject', () => {
    const roundTrip = projection.unproject(projection.project(MINSK));
    expect(roundTrip.lon).toBeCloseTo(MINSK.lon, 9);
    expect(roundTrip.lat).toBeCloseTo(MINSK.lat, 9);
  });

  it('reports the projected size of the bounds', () => {
    const northWest = projection.project({ lon: BOUNDS.west, lat: BOUNDS.north });
    const southEast = projection.project({ lon: BOUNDS.east, lat: BOUNDS.south });
    expect(projection.sizeKm.width).toBeCloseTo(southEast.x - northWest.x);
    expect(projection.sizeKm.depth).toBeCloseTo(southEast.z - northWest.z);
  });

  it('keeps distances within 3% of the great-circle distance inside the region', () => {
    const a = projection.project(BREST);
    const b = projection.project(MINSK);
    const projected = Math.hypot(b.x - a.x, b.z - a.z);
    const reference = haversineKm(BREST, MINSK);
    expect(Math.abs(projected - reference) / reference).toBeLessThan(0.03);
  });
});
