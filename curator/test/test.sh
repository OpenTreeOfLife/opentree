#!/bin/sh
set -x
if test -z $CURATOR_DOMAIN
then
    export CURATOR_DOMAIN="http://127.0.0.1:8000"
fi
python test2nexml.py "${CURATOR_DOMAIN}/curator/default/to_nexml?nexml2json=1.2.0" avian_ovomucoids.tre newick >.out.aot.v1.2.0.txt || exit
python test2nexml.py "${CURATOR_DOMAIN}/curator/default/to_nexml?nexml2json=1.0.0" avian_ovomucoids.tre newick >.out.aot.v1.0.0.txt || exit
python test2nexml.py "${CURATOR_DOMAIN}/curator/default/to_nexml?nexml2json=0.0.0" avian_ovomucoids.tre newick >.out.aot.v0.0.0.txt || exit
python test2nexml.py ${CURATOR_DOMAIN}/curator/default/to_nexml avian_ovomucoids.nex >.out.aon.def.txt || exit
python testString2nexml.py ${CURATOR_DOMAIN}/curator/default/to_nexml avian_ovomucoids.tre newick >.out.saot.newick.txt|| exit
python testString2nexml.py ${CURATOR_DOMAIN}/curator/default/to_nexml avian_ovomucoids.nex >.out.saon.def.txt || exit
