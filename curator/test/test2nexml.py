#!/usr/bin/env python
import sys, requests, uuid, json
url, filepath = sys.argv[1:3]
if len(sys.argv) > 3:
    inp = sys.argv[3]
else:
    inp = 'nexus'
files = {'file':open(filepath, 'rU')}
data = {'inputformat': inp,
        'dataDeposit': 'http://example.org'}
r = requests.post(url, files=files, data=data)
#print 'status code =', r.status_code
try:
    blob = r.json()
    print json.dumps(blob['data'],indent=1, sort_keys=True)
    print 'uploadid =', blob['uploadid']
except:
    print r.text
