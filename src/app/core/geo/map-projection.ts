import { boundsCenter, GeoBounds, GeographicLocation } from './geo-types';

/** Position on the flat map plane, in kilometres from the map centre. East is +x, south is +z. */
export interface MapPoint {
  readonly x: number;
  readonly z: number;
}

export interface MapProjection {
  readonly bounds: GeoBounds;
  /** Width (east–west) and depth (north–south) of the projected bounds in kilometres. */
  readonly sizeKm: { readonly width: number; readonly depth: number };
  project(location: GeographicLocation): MapPoint;
  unproject(point: MapPoint): GeographicLocation;
}

const KM_PER_DEGREE = 111.195;

/**
 * Equirectangular projection centred on the region. East–west scale is exact at the central
 * latitude and off by a few percent at the northern and southern edges of the MVP region, which is
 * acceptable for a regional map. It is the only place that knows how degrees map to the scene.
 */
export function createMapProjection(bounds: GeoBounds): MapProjection {
  const center = boundsCenter(bounds);
  const kmPerLonDegree = KM_PER_DEGREE * Math.cos((center.lat * Math.PI) / 180);

  return {
    bounds,
    sizeKm: {
      width: (bounds.east - bounds.west) * kmPerLonDegree,
      depth: (bounds.north - bounds.south) * KM_PER_DEGREE,
    },
    project: ({ lon, lat }) => ({
      x: (lon - center.lon) * kmPerLonDegree,
      z: -(lat - center.lat) * KM_PER_DEGREE,
    }),
    unproject: ({ x, z }) => ({
      lon: center.lon + x / kmPerLonDegree,
      lat: center.lat - z / KM_PER_DEGREE,
    }),
  };
}
