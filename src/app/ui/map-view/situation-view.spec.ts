import { FrontSituation } from '../../core/history/front-situation';
import { LocalizedText } from '../../core/i18n/localized-text';
import { toSituationView } from './situation-view';

const LABELS = { front: 'front (estimate)', pocket: 'cut off (estimate)' };
const text = (localized: LocalizedText) => localized['zh-TW'];

const SITUATION: FrontSituation = {
  day: 6,
  germanFront: [
    { lon: 26, lat: 56 },
    { lon: 28, lat: 50 },
  ],
  pockets: [
    {
      outline: [
        { lon: 24, lat: 53 },
        { lon: 25, lat: 53 },
        { lon: 24.5, lat: 53.5 },
      ],
      description: { 'zh-TW': '圈內的文字' },
    },
  ],
  arrows: [
    {
      points: [
        { lon: 27, lat: 53 },
        { lon: 27.5, lat: 53.1 },
      ],
      style: 'dashed',
    },
  ],
  sourceIds: ['source'],
};

describe('toSituationView', () => {
  it('shades nothing on a day without a stated situation', () => {
    expect(toSituationView(undefined, [], LABELS, text)).toBeUndefined();
  });

  it('hands the map the front line, the reach, every pocket and every arrow, the named ones as estimates', () => {
    const reach = [
      { lon: 27, lat: 56 },
      { lon: 28, lat: 50 },
    ];
    expect(toSituationView(SITUATION, reach, LABELS, text)).toEqual({
      front: SITUATION.germanFront,
      reach,
      arrows: SITUATION.arrows,
      frontLabel: 'front (estimate)',
      pockets: [
        {
          outline: SITUATION.pockets[0].outline,
          label: 'cut off (estimate)',
          description: '圈內的文字',
        },
      ],
    });
  });
});
