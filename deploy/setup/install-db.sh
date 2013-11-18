#!/bin/bash

# You might want to check out
#  http://stackoverflow.com/questions/16572066/resuming-rsync-partial-p-partial-on-a-interrupted-transfer

# Usage: e.g.
#    rsync -e "ssh -i opentree.pem" -vax newlocaldb.db.tgz  \
#       opentree@$host:downloads/treemachine.db.tgz
#    ssh -i opentree.pem opentree@$host setup/install_db.sh treemachine $host

# Come here after the tarball has been copied to downloads/$APP.db.tgz
# where APP = treemachine or taxomachine

function install_db {
    APP=$1

    next=neo4j-$APP/data/graph.db.new
    # Keep previous in case we need to revert
    prev=neo4j-$APP/data/graph.db.previous

    # Make space... deal with only two versions at a time
    rm -rf $prev

    rm -rf $next
    mkdir $next
    tar --directory=$next -xzf downloads/$APP.db.tgz

    neo4j-$APP/bin/neo4j stop || true

    mv neo4j-$APP/data/graph.db $prev
    mv $next neo4j-$APP/data/graph.db

    # Start the server.  (also need restart on reboot!! TBD)
    neo4j-$APP/bin/neo4j start
}

install_db $*


# Not sure what the db directory should be called; on norbert the
# names are irregular, and different between tree and taxo.  Here
# we'll just use the default 'graph.db'; that minimizes mucking around
# with neo4j config file.

