"""Merges the two readings of each evening.
Front: pool both readers' symbols, merge those within MERGE_KM, then apply the reading rule to the
pool (a symbol stays if no pooled symbol within BAND degrees of latitude lies further east).
Rings: pair the readers' rings by centre; a ring counts as enclosed when German symbols were
reported on all four sides. Writes arb/MMDD.json and an overview image; prints what needs a look."""
import sys, json, math, os, cv2, numpy as np
import compare as C
MERGE_KM, BAND, RING_PAIR_KM = 8, 0.15, 25
SAME_UNIT_KM = 25
# Checked on the sheet for 4 July (10.Pz., 20.Pz., 7.Pz.): reader A3's points sit on the east tip
# of each arc, reader B3's lie 10-15 km to the south-west of it. So where both name the same unit
# on 4-9 July, A3's coordinates are used instead of the average.
PREFER_A_FROM = '0704'
def pool_front(a,b,mmdd=''):
    items=[]
    for who,r in (('A',a),('B',b)):
        for f in r['front']:
            if not isinstance(f.get('lon'),(int,float)) or not isinstance(f.get('lat'),(int,float)): continue
            for it in items:
                d=C.km((it['lon'],it['lat']),(f['lon'],f['lat']))
                same=C.norm(it['units'][0])==C.norm(f['unit']) and C.norm(f['unit'])!=''
                if who not in it['who'] and (d<=MERGE_KM or (same and d<=SAME_UNIT_KM)):
                    if not (mmdd>=PREFER_A_FROM):
                        it['lon']=(it['lon']+f['lon'])/2; it['lat']=(it['lat']+f['lat'])/2
                    it['who']+=who; it['units'].append(f['unit']); it['conf'].append(f.get('conf','')); break
            else: items.append({'lon':f['lon'],'lat':f['lat'],'who':who,'units':[f['unit']],'conf':[f.get('conf','')],'note':f.get('note','')})
    return items
def frontmost(items):
    # Coordinates are read to two decimals, so a latitude difference of exactly BAND is common;
    # the small allowance keeps floating-point rounding from deciding those cases at random.
    keep=[it for it in items if not any(o is not it and abs(o['lat']-it['lat'])<=BAND+1e-6 and o['lon']>it['lon']+1e-9 for o in items)]
    return sorted(keep,key=lambda it:-it['lat'])
def centre(o): return (float(np.mean([p[0] for p in o])),float(np.mean([p[1] for p in o])))
def enclosed(r): return all(r.get(k) and 'none' not in str(r.get(k)).lower() for k in ('north','east','south','west'))
def pair_rings(a,b):
    out=[]; used=set()
    for ra in a['red']:
        ca=centre(ra['outline']); best=None
        for j,rb in enumerate(b['red']):
            if j in used: continue
            d=C.km(ca,centre(rb['outline']))
            if d<=RING_PAIR_KM and (best is None or d<best[0]): best=(d,j)
        if best: used.add(best[1]); out.append({'who':'AB','A':ra,'B':b['red'][best[1]]})
        else: out.append({'who':'A','A':ra})
    out+= [{'who':'B','B':rb} for j,rb in enumerate(b['red']) if j not in used]
    return out
def run(mmdd,A,B):
    a,b=A[mmdd],B[mmdd]
    items=pool_front(a,b,mmdd); front=frontmost(items)
    rings=pair_rings(a,b)
    os.makedirs('arb',exist_ok=True)
    json.dump({'front':front,'pool':items,'rings':rings},open(f'arb/{mmdd}.json','w'),ensure_ascii=False,indent=1)
    single=[f for f in front if len(f['who'])==1]
    print(f"== {mmdd}: pool {len(items)}, front {len(front)} ({sum(len(f['who'])==2 for f in front)} read by both, {len(single)} by one)")
    for f in single: print(f"   one reader [{f['who']}] {f['units'][0]!r} ({f['lon']:.2f},{f['lat']:.2f}) {f['conf'][0]} {f['note'][:60]}")
    for r in rings:
        x=r.get('A') or r.get('B'); c=centre(x['outline'])
        enc={k:enclosed(r[k]) for k in ('A','B') if k in r}
        print(f"   ring [{r['who']}] {x['text'][:44]!r} centre ({c[0]:.2f},{c[1]:.2f}) enclosed {enc}")
    line=[(f['lon'],f['lat']) for f in front]
    layers=[(line,(0,0,0),False,3)]+[([tuple(p) for p in (r.get('A') or r.get('B'))['outline']],(0,0,0),True,2) for r in rings]
    cv2.imwrite(f'arb/{mmdd}.jpg',C.overview(mmdd,layers),[cv2.IMWRITE_JPEG_QUALITY,88])
if __name__=='__main__':
    A,B=C.load('A'),C.load('B')
    for mmdd in sys.argv[1:]:
        if mmdd in A and mmdd in B: run(mmdd,A,B)
        else: print(mmdd,'missing')
