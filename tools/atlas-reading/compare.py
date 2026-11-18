"""Compares the two independent readings of each evening and draws both back onto the sheet.
Usage: compare.py MMDD [MMDD ...]   (reads read/A*.json and read/B*.json)"""
import sys, json, glob, math, re, cv2, numpy as np
import tiles as T
ROI=(180,3800,2290,5540)  # x0,y0,x1,y1 in reference half-res pixels
def load(prefix):
    out={}
    for f in sorted(glob.glob(f'read/{prefix}*.json')):
        out.update(json.load(open(f)))
    return out
def km(a,b): return math.hypot((a[0]-b[0])*111.2*math.cos(math.radians((a[1]+b[1])/2)),(a[1]-b[1])*111.2)
def norm(u): return re.sub(r'[^0-9a-z]','',u.lower().replace('tle','').replace('masse',''))
def front_line(front):
    pts=sorted(((f['lon'],f['lat']) for f in front if isinstance(f.get('lon'),(int,float))), key=lambda p:-p[1])
    return pts
def seg_dist(p,a,b):
    k=math.cos(math.radians(p[1]))*111.2
    ax,ay,bx,by,px,py=a[0]*k,a[1]*111.2,b[0]*k,b[1]*111.2,p[0]*k,p[1]*111.2
    L=(bx-ax)**2+(by-ay)**2; t=0 if L==0 else max(0,min(1,((px-ax)*(bx-ax)+(py-ay)*(by-ay))/L))
    return math.hypot(px-ax-t*(bx-ax),py-ay-t*(by-ay))
def line_dist(p,line): return min(seg_dist(p,a,b) for a,b in zip(line,line[1:])) if len(line)>1 else float('nan')
def sample(line,step=0.1):
    out=[]
    for a,b in zip(line,line[1:]):
        n=max(1,int(math.hypot(b[0]-a[0],b[1]-a[1])/step))
        out+= [(a[0]+(b[0]-a[0])*i/n, a[1]+(b[1]-a[1])*i/n) for i in range(n)]
    return out+[line[-1]] if line else out
def overview(mmdd, layers, scale=0.72):
    n={v:k for k,v in T.DATES.items()}[mmdd]
    x0,y0,x1,y1=ROI; old=T.SCALE; T.SCALE=scale
    im=T.sheet_in_ref(n)[y0:y1,x0:x1]; im=cv2.resize(im,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
    for pts,col,closed,thick in layers:
        if len(pts)<2: continue
        p=np.array([[(T.px(lo,la)[0]-x0)*scale,(T.px(lo,la)[1]-y0)*scale] for lo,la in pts],np.int32)
        cv2.polylines(im,[p],closed,col,thick,cv2.LINE_AA)
        for q in p: cv2.circle(im,(int(q[0]),int(q[1])),4,col,-1)
    im=T.draw_graticule(im,x0,y0); T.SCALE=old
    return im
if __name__=='__main__':
    A,B=load('A'),load('B')
    for mmdd in sys.argv[1:]:
        a,b=A.get(mmdd),B.get(mmdd)
        if not a or not b: print(mmdd,'missing',bool(a),bool(b)); continue
        la,lb=front_line(a['front']),front_line(b['front'])
        da=[line_dist(p,lb) for p in sample(la) if 50.5<=p[1]<=56]; db=[line_dist(p,la) for p in sample(lb) if 50.5<=p[1]<=56]
        print(f"== {mmdd}: front A {len(la)} pts, B {len(lb)} pts; A->B mean {np.mean(da):.0f} km max {np.max(da):.0f}; B->A mean {np.mean(db):.0f} max {np.max(db):.0f}")
        ua={norm(f['unit']):f for f in a['front']}; ub={norm(f['unit']):f for f in b['front']}
        both=sorted(set(ua)&set(ub), key=lambda k:-ua[k]['lat'])
        print('   same unit in both:', ', '.join(f"{ua[k]['unit']} {km((ua[k]['lon'],ua[k]['lat']),(ub[k]['lon'],ub[k]['lat'])):.0f}km" for k in both))
        print('   only A:', ', '.join(f"{f['unit']}({f['lon']},{f['lat']})" for k,f in ua.items() if k not in ub))
        print('   only B:', ', '.join(f"{f['unit']}({f['lon']},{f['lat']})" for k,f in ub.items() if k not in ua))
        for name,r in (('A',a),('B',b)):
            for red in r['red']:
                o=red['outline']; print(f"   red {name}: {red['text'][:50]!r} centre ({np.mean([p[0] for p in o]):.2f},{np.mean([p[1] for p in o]):.2f}) N:{red.get('north')} E:{red.get('east')} S:{red.get('south')} W:{red.get('west')} [{red.get('conf')}]")
        layers=[(la,(255,0,255),False,2),(lb,(0,160,255),False,2)]
        layers+=[([tuple(p) for p in r['outline']],(255,0,255),True,2) for r in a['red']]+[([tuple(p) for p in r['outline']],(0,160,255),True,2) for r in b['red']]
        cv2.imwrite(f'cmp/{mmdd}.jpg',overview(mmdd,layers),[cv2.IMWRITE_JPEG_QUALITY,88])
