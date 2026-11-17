import { Scenario } from '../../../core/history/scenario';
import { MINSK_EVENTS } from './events';
import { MINSK_SOURCES } from './sources';

/**
 * The Białystok–Minsk battle, 22 June to 9 July 1941 inclusive: the 18 days of the Soviet official
 * periodisation (Krivosheev).
 *
 * It has researched events but no units yet. Unit positions on the key dates have not been
 * researched, and nothing unresearched is shown as history.
 */
export const MINSK_SCENARIO: Scenario = {
  kind: 'history',
  epoch: { year: 1941, month: 6, day: 22 },
  timeRange: { startDay: 0, endDay: 18 },
  units: [],
  events: MINSK_EVENTS,
  sources: MINSK_SOURCES,
};
