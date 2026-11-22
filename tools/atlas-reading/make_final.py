"""Writes final.json (what goes into the data file) from final-raw.json: each evening's line and
the rings that are used, plus the arrows both readers drew
(arrows-final.json, written by arrows_merge.py). A ring's text is the reader's transcription with the reader's own remarks
in parentheses at the end removed; the description says it is the atlas's label for the ring."""
import json, re
REMARK = re.compile(r'\s*\((?:label|with note|rectangular|no text)[^)]*\)\s*$')
raw = json.load(open('final-raw.json'))
import os
ARROWS = json.load(open('arrows-final.json')) if os.path.exists('arrows-final.json') else {}
final = {}
for day, d in sorted(raw.items()):
    pockets = []
    for p in d['pockets']:
        text = re.sub(r'\s*/\s*', ' / ', REMARK.sub('', p['atlas']).strip())
        pockets.append({'outline': p['outline'], 'atlas': text,
                        'zh': f'圖集對這一圈的標註：{text}',
                        'en': f"The atlas's label for this ring: {text}"})
    arrows = [{'points': a['points'], 'style': a['style']} for a in ARROWS.get(day, {}).get('arrows', [])]
    final[day] = {'front': d['front'], 'pockets': pockets, 'arrows': arrows}
json.dump(final, open('final.json', 'w'), ensure_ascii=False, indent=1)
print('wrote final.json:', len(final), 'evenings,', sum(len(d['pockets']) for d in final.values()), 'rings')
