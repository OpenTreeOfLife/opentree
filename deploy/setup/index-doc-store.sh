#!/bin/bash

# This has to run on the host that's running the oti neo4j instance

OPENTREE_DOCSTORE=$1
CONTROLLER=$2

. setup/functions.sh

if false; then
    # No longer using pycurl!  Using requests instead.
    echo "installing pinned pycurl version, inside venv"
    # specify a pinned version to avoid getting Windows pkg
    pip install pycurl==7.19.0.2
fi

APP=oti

# setup oti database
echo "attempting to index the current commit on treenexus master branch"

# Stop neo4j!
if ./neo4j-$APP/bin/neo4j status; then
    ./neo4j-$APP/bin/neo4j stop
fi

rm -rf neo4j-$APP/data/graph.db

# Restart neo4j!
./neo4j-$APP/bin/neo4j start

echo "Indexing $OPENTREE_DOCSTORE"

# We need to pass in the doc store repo name here
# Need to explicitly run python since ours is different from what you get from #!/usr/bin/env
time python repo/$APP/index_current_repo.py http://127.0.0.1:7478/db/data/ $OPENTREE_DOCSTORE local

log "$APP database initialized from $OPENTREE_DOCSTORE and indexed"
