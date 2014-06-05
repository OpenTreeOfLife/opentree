#!/bin/bash

# For usage see README.md under 'How to push the neo4j databases'
#
# TARBALL is name of .tgz file for database (root = graph.db)
# APP is treemachine, taxomachine, or oti
# CONTROLLER is username of person doing install, e.g. jar
# Database tarball is assumed to be in downloads/$APP.db.tgz

TARBALL=$1
APP=$2
CONTROLLER=$3

. setup/functions.sh

# You might want to check out
#  http://stackoverflow.com/questions/16572066/resuming-rsync-partial-p-partial-on-a-interrupted-transfer

# Come here after the tarball has been copied to $TARBALL
# where APP = treemachine or taxomachine

next=neo4j-$APP/data/graph.db.new
# Keep previous in case we need to revert
prev=neo4j-$APP/data/graph.db.previous

# Make space... deal with only two versions at a time
rm -rf $prev

rm -rf $next
mkdir -p $next
echo "Extracting database from $TARBALL"
# Can take a while
tar --directory=$next -xzf $TARBALL

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

