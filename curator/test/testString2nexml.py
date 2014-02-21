#!/usr/bin/env python
import sys, requests, uuid
url, filepath = sys.argv[1:3]
if len(sys.argv) > 3:
    inp = sys.argv[3]
else:
    inp = 'nexus'
content = open(filepath, 'rU').read()
data = {'uploadid': str(uuid.uuid4()),
        'inputformat': inp,
        'dataDeposit': 'http://example.org',
        'content': content,
        }
r = requests.post(url, data=data)
#print 'status code =', r.status_code
try:
    print r.json()
except:
    print r.text
