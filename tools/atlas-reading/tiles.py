"""Reading tiles with a longitude/latitude graticule, and overlays of read-off lines.
Tiles are cut from sheets resampled into the reference frame, so the same pixel is the same place on every day."""
import sys, json, cv2, numpy as np
from frame import sheet_in_ref
from georef import load
G,_=load('cp_half.json',2)
DATES={5:'0622',6:'0623',7:'0624',8:'0625',9:'0626',10:'0627',11:'0628',12:'0629',13:'0630',14:'0701',15:'0702',16:'0703',17:'0704',18:'0705',19:'0706',20:'0707',21:'0708',22:'0709'}
TILES={'NW':(180,3800),'NE':(1170,3800),'SW':(180,4610),'SE':(1170,4610)}
TW,TH,SCALE=1120,930,1.3
GRID=(60,200,60)  # BGR, a green not used by the map
def px(lon,lat): return G.to_px(lon,lat)[0]
def draw_graticule(im, x0, y0):
    """Lines every 0.5 degrees; labels where they meet the tile edges."""
    out=im.copy(); layer=im.copy()
    def P(lon,lat):
        p=px(lon,lat); return int(round((p[0]-x0)*SCALE)), int(round((p[1]-y0)*SCALE))
    lons=np.arange(18.0,33.01,0.5); lats=np.arange(49.5,57.01,0.5)
    for lon in lons:
        pts=np.array([P(lon,lat) for lat in np.arange(49.5,57.01,0.1)],np.int32)
        cv2.polylines(layer,[pts],False,GRID,2 if lon%1==0 else 1,cv2.LINE_AA)
    for lat in lats:
        pts=np.array([P(lon,lat) for lon in np.arange(18.0,33.01,0.1)],np.int32)
        cv2.polylines(layer,[pts],False,GRID,2 if lat%1==0 else 1,cv2.LINE_AA)
    out=cv2.addWeighted(layer,0.55,out,0.45,0)
    h,w=out.shape[:2]
    def label(text,x,y):
        (tw,th),_=cv2.getTextSize(text,cv2.FONT_HERSHEY_SIMPLEX,0.5,1)
        x=min(max(x,2),w-tw-2); y=min(max(y,th+2),h-3)
        cv2.rectangle(out,(x-2,y-th-2),(x+tw+2,y+3),(255,255,255),-1); cv2.putText(out,text,(x,y),cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,110,0),1,cv2.LINE_AA)
    for lon in lons:
        for edge_lat_y in (8,h-8):
            # where this meridian crosses the top / bottom edge
            cand=[P(lon,lat) for lat in np.arange(49.5,57.01,0.02)]
            c=min(cand,key=lambda p:abs(p[1]-edge_lat_y))
            if 0<=c[0]<w and abs(c[1]-edge_lat_y)<6: label(f'{lon:g}E',c[0]+3,edge_lat_y+ (10 if edge_lat_y<20 else 0))
    for lat in lats:
        for edge_x in (8,w-8):
            cand=[P(lon,lat) for lon in np.arange(18.0,33.01,0.02)]
            c=min(cand,key=lambda p:abs(p[0]-edge_x))
            if 0<=c[1]<h and abs(c[0]-edge_x)<6: label(f'{lat:g}N',edge_x-(0 if edge_x<20 else 44),c[1]-4)
    return out
def tile(n, name, graticule=True, extra=None):
    x0,y0=TILES[name]; im=sheet_in_ref(n)[y0:y0+TH,x0:x0+TW]
    im=cv2.resize(im,None,fx=SCALE,fy=SCALE,interpolation=cv2.INTER_CUBIC)
    if extra: extra(im,x0,y0)
    return draw_graticule(im,x0,y0) if graticule else im
def draw_lines(lines):
    """lines: list of (points [[lon,lat],...], BGR colour, closed)"""
    def f(im,x0,y0):
        for pts,col,closed in lines:
            p=np.array([[(px(lo,la)[0]-x0)*SCALE,(px(lo,la)[1]-y0)*SCALE] for lo,la in pts],np.int32)
            cv2.polylines(im,[p],closed,col,3,cv2.LINE_AA)
            for q in p: cv2.circle(im,tuple(int(v) for v in q),5,col,-1)
    return f
if __name__=='__main__':
    import os; os.makedirs('tiles',exist_ok=True)
    for n in map(int,sys.argv[1:]):
        for name in TILES:
            cv2.imwrite(f'tiles/{DATES[n]}-{name}.jpg',tile(n,name),[cv2.IMWRITE_JPEG_QUALITY,90])
        print(n,DATES[n],'ok')
