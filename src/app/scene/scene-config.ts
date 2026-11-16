/**
 * Tunable presentation constants. Scene units are kilometres on the map plane; +y is up.
 */
export const SCENE_CONFIG = {
  /**
   * Heights are multiplied by this so that the very flat terrain of the region (mostly 100–250 m
   * over 800 km) still reads as relief. Purely a presentation choice.
   */
  verticalExaggeration: 30,
  /** Slope multiplier of the baked hillshade; lower is smoother, higher shows finer relief. */
  hillshadeStrength: 20,
  /** Terrain mesh resolution along the east–west axis; rows follow the aspect ratio. */
  terrainMeshColumns: 512,
  /** Depth of the dark "table" skirt below sea level, in scene units. */
  baseDepth: 8,
  backgroundColor: '#0e1318',

  camera: {
    fieldOfViewDegrees: 35,
    /** Initial view: looking north from the south, tilted like a sand table. */
    initialPolarDegrees: 42,
    /** Extra room around the map when the initial view is fitted to the viewport. */
    initialFitMargin: 1.1,
    minDistance: 120,
    maxDistance: 1800,
    maxPolarDegrees: 72,
    /** Camera distance used when flying to a selected place. */
    focusDistance: 260,
  },

  /** Beyond this camera distance, minor city labels are hidden to keep the map readable. */
  minorLabelMaxDistance: 620,
} as const;
