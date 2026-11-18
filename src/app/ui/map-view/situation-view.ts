import { FrontSituation } from '../../core/history/front-situation';
import { LocalizedText } from '../../core/i18n/localized-text';
import type { SituationView } from '../../scene/layers/situation-layer';

export interface SituationLabels {
  readonly front: string;
  readonly pocket: string;
}

type TextOf = (text: LocalizedText) => string;

/** What the map shades for an evening's situation; nothing when none is stated for that day. */
export function toSituationView(
  situation: FrontSituation | undefined,
  labels: SituationLabels,
  text: TextOf,
): SituationView | undefined {
  if (!situation) return undefined;
  return {
    front: situation.germanFront,
    frontLabel: labels.front,
    pockets: situation.pockets.map((pocket) => ({
      outline: pocket.outline,
      label: labels.pocket,
      description: text(pocket.description),
    })),
  };
}
