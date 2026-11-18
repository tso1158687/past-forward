"""Usage: zoom.py MMDD LON LAT OUT.jpg  -- a 3x enlargement about 1.6 degrees of longitude wide,
centred on LON/LAT, cut from that evening's sheet, with the same 0.5-degree graticule."""
import sys, cv2
import tiles as T
mmdd, lon, lat, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
n = {v: k for k, v in T.DATES.items()}[mmdd]
x, y = T.px(lon, lat)
W, H = 420, 340
x0, y0 = int(x - W / 2), int(y - H / 2)
old = T.SCALE
T.SCALE = 3.0
im = T.sheet_in_ref(n)[y0:y0 + H, x0:x0 + W]
im = cv2.resize(im, None, fx=3.0, fy=3.0, interpolation=cv2.INTER_CUBIC)
cv2.imwrite(out, T.draw_graticule(im, x0, y0), [cv2.IMWRITE_JPEG_QUALITY, 90])
print('wrote', out)
