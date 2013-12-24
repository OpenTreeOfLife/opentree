#!/bin/bash

# Grab version of python prevailing before going into venv (see functions.sh).
# The venv version fails on trying to import pycurl.
PYTHON=`which python`

# This has to run on the host that's running the oti neo4j instance

OPENTREE_DOCSTORE=$1
CONTROLLER=$2
BRANCH=master

. setup/functions.sh

echo "installing pycurl (inside venv)"
sudo pip install pycurl

APP=oti

# setup oti database
echo "attempting to index the current commit on treenexus master branch"

# Stop neo4j!
if ./neo4j-$APP/bin/neo4j status; then
    ./neo4j-$APP/bin/neo4j stop
fi

rm -rf neo4j-$APP/data/graph.db

# Restop neo4j!
./neo4j-$APP/bin/neo4j start

echo "Indexing $OPENTREE_DOCSTORE"

# We need to pass in the doc store repo name here
# Need to explicitly run python since ours is different from what you get from #!/usr/bin/env
python repo/$APP/index_current_repo.py http://127.0.0.1:7478/db/data/ $OPENTREE_DOCSTORE

log "$APP database initialized from $OPENTREE_DOCSTORE and indexed"
