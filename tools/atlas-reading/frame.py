"""Sheets resampled into the reference frame (half-res pixels of sheet 11)."""
import json, cv2, numpy as np
_cache={}
def sheet_in_ref(n):
    if n not in _cache:
        reg=json.load(open(f'reg/{n}.json')); ref=json.load(open('reg/11.json'))
        im=cv2.imread(f'half/{n}.jpg')
        _cache[n]=cv2.warpAffine(im,np.float32(reg['matrix']),tuple(ref['size']),flags=cv2.INTER_LINEAR,borderValue=(255,255,255))
    return _cache[n]
