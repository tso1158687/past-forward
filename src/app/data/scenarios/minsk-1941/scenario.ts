import { Scenario } from '../../../core/history/scenario';
import { MINSK_BORDERS } from './borders';
import { MINSK_EVENTS } from './events';
import { MINSK_SITUATIONS } from './situations';
import { MINSK_STORY } from './story';
import { MINSK_SOURCES } from './sources';
import { MINSK_UNITS } from './units';

/**
 * The Białystok–Minsk battle, 22 June to 9 July 1941 inclusive: the 18 days of the Soviet official
 * periodisation (Krivosheev).
 *
 * Events and unit positions are researched; how each was verified is recorded in docs/research/.
 * A unit is on the map only on days for which a source places it.
 */
export const MINSK_SCENARIO: Scenario = {
  kind: 'history',
  epoch: { year: 1941, month: 6, day: 22 },
  timeRange: { startDay: 0, endDay: 18 },
  units: MINSK_UNITS,
  situations: MINSK_SITUATIONS,
  story: MINSK_STORY,
  borders: MINSK_BORDERS,
  events: MINSK_EVENTS,
  sources: MINSK_SOURCES,
};
