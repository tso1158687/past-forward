import { Scenario } from '../../core/history/scenario';

/**
 * DEMONSTRATION DATA — NOT HISTORY.
 *
 * Two made-up units on made-up routes, used only to exercise the timeline, interpolation and
 * marker rendering before researched data exists. The units are deliberately not named after real
 * formations and their routes do not follow any real operation. This file is to be replaced by
 * the researched scenario in Milestone 3.
 *
 * Only the epoch and time range reflect the chapter: 22 June to 10 July 1941 inclusive.
 */
export const DEMO_SCENARIO: Scenario = {
  kind: 'demonstration',
  epoch: { year: 1941, month: 6, day: 22 },
  timeRange: { startDay: 0, endDay: 19 },
  units: [
    {
      id: 'demo-a',
      name: { 'zh-TW': '示範單位 A', en: 'Demo unit A' },
      positions: [
        { day: 0, location: { lon: 21.6, lat: 51.4 } },
        { day: 5, location: { lon: 24.6, lat: 51.2 } },
        { day: 6, location: { lon: 25.4, lat: 51.6 } },
        { day: 12, location: { lon: 28.6, lat: 52.3 } },
        { day: 18, location: { lon: 30.4, lat: 51.4 } },
      ],
    },
    {
      id: 'demo-b',
      name: { 'zh-TW': '示範單位 B', en: 'Demo unit B' },
      positions: [
        { day: 3, location: { lon: 28.4, lat: 55.5 } },
        { day: 9, location: { lon: 25.0, lat: 55.4 } },
        { day: 15, location: { lon: 22.0, lat: 55.3 } },
      ],
    },
  ],
};
