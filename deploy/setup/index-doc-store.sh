#!/bin/bash

. setup/functions.sh

CONTROLLER=$1
BRANCH=master

# setup oti database
echo "attempting to index the current commit on treenexus master branch"
if [ -d neo4j-oti/data/graph.db ]; then
    rm -rf neo4j-oti/data/graph.db
fi
./neo4j-oti/bin/neo4j restart
repo/oti/index_current_repo.py http://localhost:7478/db/data/

log "OTI database indexed"
