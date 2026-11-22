"""Writes src/app/data/scenarios/minsk-1941/situations.ts from final.json, the arbitrated reading.
final.json: { "MMDD": { "front": [[lon, lat], ...] north to south,
                        "pockets": [ { "outline": [[lon, lat], ...], "atlas": "text on the map", "zh": "...", "en": "..." } ] } }"""
import json
import os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','src','app','data','scenarios','minsk-1941','situations.ts')
DAY={'0622':0,'0623':1,'0624':2,'0625':3,'0626':4,'0627':5,'0628':6,'0629':7,'0630':8,'0701':9,'0702':10,'0703':11,'0704':12,'0705':13,'0706':14,'0707':15,'0708':16,'0709':17}
final=json.load(open('final.json'))
def pts(ps): return '[' + ', '.join(f'[{p[0]:g}, {p[1]:g}]' for p in ps) + ']'
def q(s): return "'" + s.replace("\\","\\\\").replace("'","\\'") + "'"
lines=["""import { GeographicLocation } from '../../../core/geo/geo-types';
import {
  FrontSituation,
  Pocket,
  SituationArrow,
} from '../../../core/history/front-situation';
import { LocalizedText } from '../../../core/i18n/localized-text';

/*
 * Generated from the arbitrated reading of the atlas sheets; do not edit by hand. How the sheets
 * were read, and what the line and the rings do and do not mean, is recorded in
 * docs/research/minsk-front-situation.md. To change anything, change that document first.
 */

type Coordinates = readonly (readonly [lon: number, lat: number])[];

const places = (coordinates: Coordinates): GeographicLocation[] =>
  coordinates.map(([lon, lat]) => ({ lon, lat }));

const pocket = (outline: Coordinates, description: LocalizedText): Pocket => ({
  outline: places(outline),
  description,
});

const arrow = (points: Coordinates, style: SituationArrow['style']): SituationArrow => ({
  points: places(points),
  style,
});

/** One evening as drawn on the atlas sheet for that day. */
const evening = (
  day: number,
  front: Coordinates,
  pockets: readonly Pocket[],
  arrows: readonly SituationArrow[] = [],
): FrontSituation => ({
  day,
  germanFront: places(front),
  pockets,
  arrows,
  sourceIds: ['okh-atlas'],
});

// prettier-ignore
export const MINSK_SITUATIONS: readonly FrontSituation[] = ["""]
for mmdd in sorted(final, key=lambda k: DAY[k]):
    d=final[mmdd]
    lines.append(f"  // {int(mmdd[:2])}/{int(mmdd[2:])}")
    ps=[f"pocket({pts(p['outline'])}, {{ 'zh-TW': {q(p['zh'])}, en: {q(p['en'])} }})" for p in d['pockets']]
    arrows=[f"arrow({pts(a['points'])}, {q(a['style'])})" for a in d.get('arrows',[])]
    tail=f", [{', '.join(arrows)}]" if arrows else ''
    lines.append(f"  evening({DAY[mmdd]}, {pts(d['front'])}, [{', '.join(ps)}]{tail}),")
lines.append("];\n")
open(OUT,'w').write('\n'.join(lines))
print('wrote', OUT, len(final), 'evenings')
