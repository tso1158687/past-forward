"""Contact sheet of 3x zooms around given places on one evening, each marked with a cross.
Usage: check_zoom.py MMDD OUT.jpg "lon,lat,label" ..."""
import sys, cv2, numpy as np
import tiles as T
mmdd,out=sys.argv[1],sys.argv[2]; n={v:k for k,v in T.DATES.items()}[mmdd]
W,H,Z=230,190,2.6; tiles=[]
for spec in sys.argv[3:]:
    lon,lat,label=spec.split(',',2); lon,lat=float(lon),float(lat)
    x,y=T.px(lon,lat); x0,y0=int(x-W/2),int(y-H/2)
    old=T.SCALE; T.SCALE=Z
    im=cv2.resize(T.sheet_in_ref(n)[y0:y0+H,x0:x0+W],None,fx=Z,fy=Z,interpolation=cv2.INTER_CUBIC)
    im=T.draw_graticule(im,x0,y0); T.SCALE=old
    cv2.drawMarker(im,(int(W*Z/2),int(H*Z/2)),(255,0,255),cv2.MARKER_TILTED_CROSS,26,2)
    cv2.rectangle(im,(0,0),(im.shape[1]-1,im.shape[0]-1),(0,0,0),2)
    cv2.rectangle(im,(4,im.shape[0]-24),(8+9*len(label),im.shape[0]-4),(255,255,255),-1)
    cv2.putText(im,label,(6,im.shape[0]-9),cv2.FONT_HERSHEY_SIMPLEX,0.5,(200,0,0),1,cv2.LINE_AA)
    tiles.append(im)
cols=3; rows=(len(tiles)+cols-1)//cols; h,w=tiles[0].shape[:2]
sheet=np.full((rows*h,cols*w,3),255,np.uint8)
for i,t in enumerate(tiles): sheet[(i//cols)*h:(i//cols+1)*h,(i%cols)*w:(i%cols+1)*w]=t
cv2.imwrite(out,sheet,[cv2.IMWRITE_JPEG_QUALITY,88]); print(sheet.shape)
