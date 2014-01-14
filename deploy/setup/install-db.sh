#!/bin/bash

OPENTREE_HOST=$1
APP=$2
CONTROLLER=$3

. setup/functions.sh

# You might want to check out
#  http://stackoverflow.com/questions/16572066/resuming-rsync-partial-p-partial-on-a-interrupted-transfer

# For usage see sample.config

# Come here after the tarball has been copied to downloads/$APP.db.tgz
# where APP = treemachine or taxomachine

next=neo4j-$APP/data/graph.db.new
# Keep previous in case we need to revert
prev=neo4j-$APP/data/graph.db.previous

# Make space... deal with only two versions at a time
rm -rf $prev

rm -rf $next
mkdir -p $next
tar --directory=$next -xzf downloads/$APP.db.tgz

neo4j-$APP/bin/neo4j stop || true

mv neo4j-$APP/data/graph.db $prev
mv $next neo4j-$APP/data/graph.db
log "Installed $APP neo4j database"

# Start the server.  (also need restart on reboot!! TBD)
neo4j-$APP/bin/neo4j start


# Not sure what the db directory should be called; on norbert the
# names are irregular, and different between tree and taxo.  Here
# we'll just use the default 'graph.db'; that minimizes mucking around
# with neo4j config file.

