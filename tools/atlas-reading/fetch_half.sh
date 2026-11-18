#!/bin/sh
# Usage: fetch_half.sh N -> half/N.jpg, the 3840-px-wide rendering from Wikimedia Commons
N=$1
[ -s "half/$N.jpg" ] && { echo "$N cached"; exit 0; }
URL=$(python3 -c "import urllib.parse,sys;print('https://commons.wikimedia.org/wiki/Special:FilePath/'+urllib.parse.quote('Der Feldzug gegen Sowjet-Russland - Band I. Operationen Sommer-Herbst 1941 vom 21. Juni-6. Dezember 1941 LOC map51000141-'+sys.argv[1]+'.jpg')+'?width=3840')" "$N")
curl -sL -A "map-research/1.0" --max-time 540 -o "half/$N.tmp" -w "$N %{http_code} %{size_download} %{time_total}s\n" "$URL" && mv "half/$N.tmp" "half/$N.jpg" || { echo "$N failed"; rm -f "half/$N.tmp"; }
