#!/usr/bin/env python
import sys, requests, uuid
url, filepath = sys.argv[1:]
files = {'file':open(filepath, 'rU')}
data = {'uploadid': str(uuid.uuid4()), 'output':'nexml'}
r = requests.post(url, files=files, data=data)
print 'status code =', r.status_code
try:
    print r.json()
except:
    print r.text
