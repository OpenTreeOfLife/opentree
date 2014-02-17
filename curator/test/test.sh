#!/bin/sh
set -x
python test2nexml.py http://127.0.0.1:8000/curator/default/to_nexml avian_ovomucoids.tre newick || exit
python test2nexml.py http://127.0.0.1:8000/curator/default/to_nexml avian_ovomucoids.nex || exit
python testString2nexml.py http://127.0.0.1:8000/curator/default/to_nexml avian_ovomucoids.tre newick || exit
python testString2nexml.py http://127.0.0.1:8000/curator/default/to_nexml avian_ovomucoids.nex || exit
