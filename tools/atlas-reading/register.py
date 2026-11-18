"""Finds the affine transform taking half-res sheet N pixels to half-res reference (sheet 11) pixels.
The base map is the same on every sheet; only the scan geometry differs. Saves reg/N.json."""
import sys, json, cv2, numpy as np
REF=11
# Region of the reference used for matching: generously around Army Group Centre.
X0,Y0,X1,Y1=300,3300,2700,5600
def load(n):
    im=cv2.imread(f'half/{n}.jpg'); return im
def gray_base(im):
    # Suppress the coloured overlay (blue/red ink) so that matching relies on the base map.
    g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    return cv2.createCLAHE(2.0,(8,8)).apply(g)
def register(n):
    ref=load(REF); im=load(n)
    s=im.shape[0]/ref.shape[0]
    a=gray_base(ref)[Y0:Y1,X0:X1]
    yy0,yy1=int(Y0*s)-200,int(Y1*s)+200
    b=gray_base(im)[max(yy0,0):yy1, max(X0-200,0):X1+200]
    sift=cv2.SIFT_create(12000)
    ka,da=sift.detectAndCompute(a,None); kb,db=sift.detectAndCompute(b,None)
    m=cv2.BFMatcher().knnMatch(db,da,k=2)
    good=[p for p,q in m if p.distance<0.7*q.distance]
    src=np.float32([kb[g.queryIdx].pt for g in good])+[max(X0-200,0),max(yy0,0)]
    dst=np.float32([ka[g.trainIdx].pt for g in good])+[X0,Y0]
    M,inl=cv2.estimateAffine2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3.0)
    inl=inl.ravel().astype(bool)
    err=np.linalg.norm((src[inl]@M[:,:2].T+M[:,2])-dst[inl],axis=1)
    out={'sheet':n,'matrix':M.tolist(),'matches':len(good),'inliers':int(inl.sum()),'rms_px':float(np.sqrt((err**2).mean())),'size':[im.shape[1],im.shape[0]]}
    json.dump(out,open(f'reg/{n}.json','w')); return out
if __name__=='__main__':
    import os; os.makedirs('reg',exist_ok=True)
    for n in sys.argv[1:]:
        if int(n)==REF:
            im=load(REF); json.dump({'sheet':REF,'matrix':[[1,0,0],[0,1,0]],'matches':0,'inliers':0,'rms_px':0,'size':[im.shape[1],im.shape[0]]},open(f'reg/{REF}.json','w')); print(REF,'identity'); continue
        o=register(int(n)); print(o['sheet'],'matches',o['matches'],'inliers',o['inliers'],'rms %.2f'%o['rms_px'],np.round(o['matrix'],4).tolist())
