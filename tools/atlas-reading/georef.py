"""Fits pixel = f(lon, lat) for the atlas base map from control points (cp.json), and back."""
import json, numpy as np
def design(lon, lat, order):
    lon=np.asarray(lon,float)-26.0; lat=np.asarray(lat,float)-53.5
    cols=[np.ones_like(lon), lon, lat]
    if order>=2: cols+=[lon*lat, lon**2, lat**2]
    return np.stack(cols,1)
class Georef:
    def __init__(self, cps, order=2):
        self.order=order
        lon=[c[1] for c in cps]; lat=[c[2] for c in cps]
        A=design(lon,lat,order); P=np.array([[c[3],c[4]] for c in cps],float)
        self.coef,*_=np.linalg.lstsq(A,P,rcond=None)
        self.res=A@self.coef-P
    def to_px(self, lon, lat): return design(np.atleast_1d(lon),np.atleast_1d(lat),self.order)@self.coef
    def to_lonlat(self, x, y):
        # Newton iteration from an affine first guess
        lon,lat=26.0,53.5
        for _ in range(30):
            p=self.to_px(lon,lat)[0]; e=1e-4
            J=np.array([(self.to_px(lon+e,lat)[0]-p)/e,(self.to_px(lon,lat+e)[0]-p)/e]).T
            d=np.linalg.solve(J,np.array([x,y])-p); lon+=d[0]; lat+=d[1]
            if abs(d).max()<1e-9: break
        return lon,lat
def load(path='cp.json', order=2):
    cps=json.load(open(path)); return Georef(cps,order), cps
