#!/usr/bin/env python
import sys, requests, uuid
url, filepath = sys.argv[1:3]
if len(sys.argv) > 3:
    inp = sys.argv[3]
else:
    inp = 'nexus'
content = open(filepath, 'rU').read()
data = {'inputFormat': inp,
        'idPrefix': '',
        'dataDeposit': 'http://example.org',
        'content': content,
        }
r = requests.post(url, data=data)
try:
    blob = r.json()
    print json.dumps(blob['data'],indent=1, sort_keys=True)
    print 'uploadid =', blob['uploadid']
except:
    print r.text
if 200 != r.status_code:
    sys.exit(r.status_code)
try:
    trees = blob['data']['nexml']['trees']
    sys.exit('Unexpected trees found!')
except Exception:
    pass
