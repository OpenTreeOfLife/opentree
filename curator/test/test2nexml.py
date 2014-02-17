#!/usr/bin/env python
import sys, requests, uuid
url, filepath = sys.argv[1:3]
if len(sys.argv) > 3:
    inp = sys.argv[3]
else:
    inp = 'nexus'
files = {'file':open(filepath, 'rU')}
data = {'uploadid': str(uuid.uuid4()),
        'inputformat': inp,
        'dataDeposit': 'http://example.org'}
r = requests.post(url, files=files, data=data)
print 'status code =', r.status_code
try:
    print r.json()
except:
    print r.text
