#!/usr/bin/env python
import sys, requests, uuid, json, codecs
url, filepath = sys.argv[1:3]
#inp = json.load()
data = {'nexson': codecs.open(filepath, 'rU', encoding='utf-8').read()}
r = requests.post(url, data=data)
try:
    blob = r.json()
    print json.dumps(blob,indent=1, sort_keys=True)
except:
    print r.text
if 200 != r.status_code:
    sys.exit(r.status_code)
