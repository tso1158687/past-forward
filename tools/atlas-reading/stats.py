"""Prints the per-evening table of docs/research/minsk-front-situation.md.
'Apart' is the median distance between the two readers' points for the same unit: for every
designation that occurs exactly once in each reader's list for that evening (compared after
dropping spaces, punctuation, case and the word Tle.), the distance between the two points."""
import json, statistics, collections
import compare as C
A, B = C.load('A'), C.load('B'); raw = json.load(open('final-raw.json'))
def once(front):
    names = collections.Counter(C.norm(f['unit']) for f in front)
    return {C.norm(f['unit']): f for f in front if C.norm(f['unit']) and names[C.norm(f['unit'])] == 1}
total = both_total = 0
print('| 晚上 | 讀者 A 讀到 | 讀者 B 讀到 | 線上的符號 | 其中兩人都讀到 | 同名符號兩人相差（中位數，公里） | 採用的紅圈 |')
print('| --- | --- | --- | --- | --- | --- | --- |')
for day in sorted(raw):
    symbols = raw[day]['symbols']; both = sum(len(s['who']) == 2 for s in symbols)
    a, b = once(A[day]['front']), once(B[day]['front'])
    apart = [C.km((a[k]['lon'], a[k]['lat']), (b[k]['lon'], b[k]['lat'])) for k in set(a) & set(b)]
    total += len(symbols); both_total += both
    print(f"| {int(day[:2])}/{int(day[2:])} | {len(A[day]['front'])} | {len(B[day]['front'])} | {len(symbols)} | {both} | {statistics.median(apart):.0f}（{len(apart)} 個） | {len(raw[day]['pockets'])} |")
print(f'合計線上 {total} 個，兩人都讀到 {both_total} 個，只有一人讀到 {total - both_total} 個')
