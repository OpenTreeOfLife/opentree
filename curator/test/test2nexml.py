#!/usr/bin/env python
import sys, requests, uuid, json
url, filepath = sys.argv[1:3]
if len(sys.argv) > 3:
    inp = sys.argv[3]
else:
    inp = 'nexus'
files = {'file':open(filepath, 'rU')}
data = {'inputFormat': inp,
        'idPrefix':''}
r = requests.post(url, files=files, data=data)
try:
    blob = r.json()
    print json.dumps(blob,indent=1, sort_keys=True)
except:
    print r.text
if 200 != r.status_code:
    sys.exit(r.status_code)
