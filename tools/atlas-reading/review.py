"""Lists what I must look at myself for each evening: front symbols that only one reader gave and
that move the line by more than MATTER_KM, plus every 'unsure' symbol on the line. Makes a contact
sheet of zooms (review/MMDD.jpg), numbered in the order printed."""
import sys, json, subprocess, os
import compare as C, arbitrate as R, finalize as F
MATTER_KM=12
A,B=C.load('A'),C.load('B'); ov=json.load(open('overrides.json')) if os.path.exists('overrides.json') else {}
for mmdd in sys.argv[1:]:
    d=F.build(mmdd,A,B,ov); syms=d['symbols']; todo=[]
    for i,s in enumerate(syms):
        if len(s['who'])==2 and 'unsure' not in s['conf']: continue
        rest=[(t['lon'],t['lat']) for j,t in enumerate(syms) if j!=i]
        shift=C.line_dist((s['lon'],s['lat']),rest)
        if shift>=MATTER_KM or 'unsure' in s['conf']: todo.append((s,shift))
    print(f"== {mmdd}: {len(todo)} to look at")
    specs=[]
    for k,(s,shift) in enumerate(todo,1):
        print(f"   {k}. [{s['who']}] {s['units'][0][:40]!r} ({s['lon']:.2f},{s['lat']:.2f}) moves line {shift:.0f} km; {s['conf']} {s.get('note','')[:70]}")
        specs.append(f"{s['lon']:.3f},{s['lat']:.3f},{k} {s['who']} {s['units'][0][:14]}")
    if specs: subprocess.run([sys.executable,'check_zoom.py',mmdd,f'review/{mmdd}.jpg']+specs,stdout=subprocess.DEVNULL)
