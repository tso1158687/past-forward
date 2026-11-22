"""Pairs the two independent readings of the blue arrows and keeps those both readers drew.
Two arrows are the same when their tips lie within TIP_KM and their tails within TAIL_KM.
The kept geometry is reader A's (on 4-9 July reader B's points are offset; see the research
document). Writes arrows-final.json and, with the scans present, arrows/MMDD.jpg for review.
Usage: arrows_merge.py [MMDD ...]"""
import sys, os, json, glob, cv2
import compare as C
TIP_KM, TAIL_KM = 15, 25
# Arrows drawn from a small train or vehicle symbol, usually labelled with dates ("bis 6.7.") or
# "Antransport", show divisions being brought up by rail or road, not an attack; they are left out.
# A reader's word is enough. Where it is wrong (two small circles at a tail, the mark many attack
# arrows carry, once called "vehicle-like"), arrows-overrides.json lists the arrow under "attack".
TRANSPORT_WORDS = ('vehicle', 'train', 'locomotive', 'loco', 'antransp', 'sleigh', '火車', '車輛')
def is_transport(arrow):
    text = (arrow.get('note', '') + ' ' + arrow.get('label', '')).lower()
    return any(word in text for word in TRANSPORT_WORDS)
def load(prefix):
    out = {}
    for f in sorted(glob.glob(f'arrows/{prefix}*.json')):
        out.update(json.load(open(f)))
    return out
BOUNDS = (19.5, 31.5, 50.5, 56.0)  # west, east, south, north: the area the map covers
def on_map(p):
    return BOUNDS[0] <= p[0] <= BOUNDS[1] and BOUNDS[2] <= p[1] <= BOUNDS[3]
def valid(a):
    """Well formed, and at least partly on the map: arrows wholly outside it cannot be shown."""
    p = a.get('points') or []
    return (len(p) >= 2 and all(isinstance(v, (int, float)) for q in p for v in q[:2])
            and any(on_map(q) for q in p))
def pair(a_list, b_list):
    pairs, used = [], set()
    for a in a_list:
        best = None
        for j, b in enumerate(b_list):
            if j in used: continue
            tip = C.km(tuple(a['points'][-1][:2]), tuple(b['points'][-1][:2]))
            tail = C.km(tuple(a['points'][0][:2]), tuple(b['points'][0][:2]))
            if tip <= TIP_KM and tail <= TAIL_KM and (best is None or tip + tail < best[0]):
                best = (tip + tail, j, tip, tail)
        if best:
            used.add(best[1]); pairs.append((a, b_list[best[1]], best[2], best[3]))
    only_a = [a for a in a_list if not any(a is p[0] for p in pairs)]
    only_b = [b for j, b in enumerate(b_list) if j not in used]
    return pairs, only_a, only_b
if __name__ == '__main__':
    A, B = load('A'), load('B')
    overrides = json.load(open('arrows-overrides.json')) if os.path.exists('arrows-overrides.json') else {}
    days = sys.argv[1:] or sorted(set(A) & set(B))
    final = json.load(open('arrows-final.json')) if os.path.exists('arrows-final.json') else {}
    os.makedirs('arrows', exist_ok=True)
    for day in days:
        a_list = [a for a in A[day]['arrows'] if valid(a)]
        b_list = [b for b in B[day]['arrows'] if valid(b)]
        pairs, only_a, only_b = pair(a_list, b_list)
        drop = overrides.get(day, {}).get('drop', [])
        attack = overrides.get(day, {}).get('attack', [])
        near = lambda arrow, tips: any(C.km(tuple(arrow['points'][-1][:2]), tuple(t)) <= 8 for t in tips)
        kept = []
        transport = []
        for a, b, tip, tail in pairs:
            if near(a, drop): continue
            if (is_transport(a) or is_transport(b)) and not near(a, attack):
                transport.append({'points': a['points'], 'unit': a.get('unit', ''), 'labelA': a.get('label', ''), 'labelB': b.get('label', '')})
                continue
            style = a['style'] if a['style'] == b['style'] else 'solid'
            kept.append({'points': [[round(p[0], 3), round(p[1], 3)] for p in a['points']], 'style': style,
                         'unit': a.get('unit', ''), 'unitB': b.get('unit', ''), 'styleA': a['style'], 'styleB': b['style'],
                         'tipKm': round(tip, 1), 'tailKm': round(tail, 1), 'conf': [a.get('conf'), b.get('conf')]})
        final[day] = {'arrows': kept, 'transport': transport,
                      'onlyA': [{'points': x['points'], 'unit': x.get('unit', ''), 'style': x['style'], 'conf': x.get('conf'), 'note': x.get('note', '')} for x in only_a],
                      'onlyB': [{'points': x['points'], 'unit': x.get('unit', ''), 'style': x['style'], 'conf': x.get('conf'), 'note': x.get('note', '')} for x in only_b]}
        print(f"{day}: A {len(a_list)}, B {len(b_list)}, both {len(pairs)}, kept {len(kept)}, transport {len(transport)}, only A {len(only_a)}, only B {len(only_b)}; "
              + '; '.join(f"{k['unit'] or '?'} {k['tipKm']}/{k['tailKm']}km {k['styleA']}/{k['styleB']}" for k in kept))
        if os.path.isdir('half'):
            layers = [([tuple(p) for p in k['points']], (0, 0, 0), False, 3) for k in kept]
            layers += [([tuple(p[:2]) for p in x['points']], (255, 0, 255), False, 2) for x in only_a]
            layers += [([tuple(p[:2]) for p in x['points']], (0, 160, 255), False, 2) for x in only_b]
            cv2.imwrite(f'arrows/{day}.jpg', C.overview(day, layers), [cv2.IMWRITE_JPEG_QUALITY, 88])
    json.dump(dict(sorted(final.items())), open('arrows-final.json', 'w'), ensure_ascii=False, indent=1)
