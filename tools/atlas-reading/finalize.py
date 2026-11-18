"""Applies my arbitration decisions (overrides.json) to the pooled readings and writes final.json.
overrides.json: { "MMDD": { "drop_front": [[lon, lat], ...],      pooled symbols to leave out (matched within 6 km)
                            "add_front":  [[lon, lat, "unit"], ...] symbols both readers missed
                            "drop_rings": [[lon, lat], ...],      rings to leave out, by centre (within 15 km)
                            "ring_from":  {"lon,lat": "A"|"B"} } } whose outline to use when both drew it
A ring is kept as "Soviet forces behind the front" when its centre lies west of the final front line."""
import sys, json, os, cv2, numpy as np
import compare as C, arbitrate as R
NORTH_END, SOUTH_END = 56.6, 49.9
def inside(p, poly):
    x,y=p; n=len(poly); c=False
    for i in range(n):
        x1,y1=poly[i]; x2,y2=poly[(i+1)%n]
        if (y1>y)!=(y2>y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
    return c
SLIT_DEPTH_KM, SLIT_WIDTH_DEG, KM_PER_LON = 50, 1.0, 66
def remove_slits(front):
    """Drops a symbol that makes the line turn back west by more than SLIT_DEPTH_KM and come out
    east again within SLIT_WIDTH_DEG of latitude: a slit that narrow comes from a rear unit standing
    in a thin band of latitude where no foremost unit happens to be drawn."""
    front=list(front); changed=True
    while changed:
        changed=False
        for i in range(1,len(front)-1):
            a,p,b=front[i-1],front[i],front[i+1]
            if (min(a['lon'],b['lon'])-p['lon'])*KM_PER_LON>SLIT_DEPTH_KM and a['lat']-b['lat']<SLIT_WIDTH_DEG:
                front.pop(i); changed=True; break
    return front
def near(p, pts, km): return any(C.km(p,(q[0],q[1]))<=km for q in pts)
def build(mmdd, A, B, ov):
    o=ov.get(mmdd,{})
    items=[it for it in R.pool_front(A[mmdd],B[mmdd],mmdd) if not near((it['lon'],it['lat']),o.get('drop_front',[]),6)]
    items+=[{'lon':a[0],'lat':a[1],'who':'me','units':[a[2]],'conf':['clear'],'note':'added in arbitration'} for a in o.get('add_front',[])]
    front=remove_slits(R.frontmost(items))
    line=[[round(f['lon'],2),round(f['lat'],2)] for f in front]
    if line[0][1]<NORTH_END: line.insert(0,[line[0][0],NORTH_END])
    if line[-1][1]>SOUTH_END: line.append([line[-1][0],SOUTH_END])
    area=[[10.0,line[0][1]]]+line+[[10.0,line[-1][1]]]
    pockets=[]; others=[]
    for r in R.pair_rings(A[mmdd],B[mmdd]):
        x=r.get('A') or r.get('B'); c=R.centre(x['outline'])
        if near(c,o.get('drop_rings',[]),15): continue
        pick=o.get('ring_from',{}).get(f'{c[0]:.2f},{c[1]:.2f}')
        if pick and pick in r: x=r[pick]
        outline=[[round(p[0],2),round(p[1],2)] for p in x['outline']]
        entry={'outline':outline,'atlas':x['text'],'who':r['who'],'centre':[round(c[0],2),round(c[1],2)]}
        # A ring is used only when both readers drew it, its centre is on the map and west of the line.
        (pockets if r['who']=='AB' and 50.5<=c[1]<=56.0 and inside(c,area) else others).append(entry)
    return {'front':line,'symbols':front,'pockets':pockets,'rings_not_behind_front':others}
if __name__=='__main__':
    A,B=C.load('A'),C.load('B'); ov=json.load(open('overrides.json')) if os.path.exists('overrides.json') else {}
    days=sys.argv[1:] or sorted(set(A)&set(B))
    final=json.load(open('final-raw.json')) if os.path.exists('final-raw.json') else {}
    render=os.path.isdir('half')  # the scans are not kept in the repository
    if render: os.makedirs('final',exist_ok=True)
    for mmdd in days:
        d=build(mmdd,A,B,ov); final[mmdd]=d
        print(f"{mmdd}: front {len(d['front'])} pts; pockets {[(p['atlas'][:28],p['who'],p['centre']) for p in d['pockets']]}; other rings {len(d['rings_not_behind_front'])}")
        if not render: continue
        layers=[([tuple(p) for p in d['front']],(0,0,0),False,3)]+[([tuple(q) for q in p['outline']],(0,0,255),True,3) for p in d['pockets']]+[([tuple(q) for q in p['outline']],(120,120,120),True,1) for p in d['rings_not_behind_front']]
        cv2.imwrite(f'final/{mmdd}.jpg',C.overview(mmdd,layers),[cv2.IMWRITE_JPEG_QUALITY,88])
    json.dump(final,open('final-raw.json','w'),ensure_ascii=False,indent=1)
