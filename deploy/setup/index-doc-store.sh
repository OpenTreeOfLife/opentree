#!/bin/bash

# This has to run on the host that's running the oti neo4j instance.

# graph.db should be initialized by copying a taxomachine database.

# Command line arguments:
#   - URL prefix for communicating with the phylesystem API
#       (e.g. 'http://ot12.opentreeoflife.org/api/v1')
#   - username of person doing the operation (e.g. 'jar')

OPENTREE_API_BASE_URL=$1
CONTROLLER=$2

. setup/functions.sh

APP=oti

git_refresh OpenTreeOfLife oti || true

if false; then
    # Stop neo4j!
    if ./neo4j-$APP/bin/neo4j status; then
        ./neo4j-$APP/bin/neo4j stop
    fi

    # See https://github.com/OpenTreeOfLife/oti/issues/18
    # When an oti service to flush all studies exists, we will call it here.
    rm -rf neo4j-$APP/data/graph.db

    # Restart neo4j!
    ./neo4j-$APP/bin/neo4j start
fi

echo "Indexing studies from API at $OPENTREE_API_BASE_URL"

# We need to pass in the doc store repo name here
# Need to explicitly run python since ours is different from what you get from #!/usr/bin/env

time python repo/$APP/index_current_repo.py http://127.0.0.1:7478/db/data/ $OPENTREE_API_BASE_URL/..

log "$APP database initialized from $OPENTREE_API_BASE_URL and indexed"
