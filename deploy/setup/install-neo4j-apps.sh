#!/bin/bash

total=`df -m . | (read; read fs total used available percent; echo $total)`

if [ $total -lt 80000 ]; then
    echo 1>&2 Disk too small, doing sham neo4j apps install
    FORREAL=no
elif [ x$FORREAL = x ]; then
    FORREAL=yes
fi

# Will not run on free tier.  Recommended at least 80G disk and 16G RAM.

echo "Installing treemachine and taxomachine"
date

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads

# ---------- JDK ----------
# Available before: 6355, after: 6088
if [ `which java`x = x ]; then
    sudo apt-get --assume-yes install openjdk-7-jre
fi

# ---------- NEO4J ----------
if [ ! -r downloads/neo4j.tgz ]; then
    wget --no-verbose -O downloads/neo4j.tgz http://dist.neo4j.org/neo4j-community-1.9.4-unix.tar.gz?edition=community&version=1.9.4&distribution=tarball&dlid=2824963
fi

# ---------- TREEMACHINE ----------
# Set up treemachine neo4j server
if [ ! -x neo4j-tree/bin/neo4j ] ; then
    tar xzf downloads/neo4j.tgz
    mv neo4j-community-* neo4j-tree
fi

# Plugins
echo Fetching neo4j treemachine plugin
wget --no-verbose -O neo4j-tree/plugins/tree.jar http://dev.opentreeoflife.org:/export/tree.jar

# Database
if [ $FORREAL = yes ]; then
    # 6G, expands to 12G (AWS free tier only gives you 8G total)
    wget --no-verbose -O downloads/tree.db.tgz http://dev.opentreeoflife.org:/export/tree.db.tgz
    rm -rf db.tmp
    mkdir db.tmp
    tar xzf -C db.tmp downloads/tree.db.tgz
    mv db.tmp/* neo4j-tree/data/graph.db
fi

# Start the server.  (also need restart on reboot, TBD)
if $FORREAL = yes; then
    neo4j-tree/bin/neo4j stop
    neo4j-tree/bin/neo4j start
fi

# ---------- TAXOMACHINE ----------
# Set up taxomachine neo4j server
if [ ! -x neo4j-taxo/bin/neo4j ] ; then
    tar xzf downloads/neo4j.tgz
    mv neo4j-community-* neo4j-taxo
fi

# Taxomachine should listen on ports 7476 and 7475 to avoid collision
# with treemachine
if grep -s 7474 neo4j-taxo/conf/neo4j-server.properties ; then
    cp -p neo4j-taxo/conf/neo4j-server.properties tmp.tmp
    sed -e s/=7474/=7476/ <tmp.tmp | \
        sed -e s/=7473/=7475/ >neo4j-taxo/conf/neo4j-server.properties
    rm tmp.tmp
fi

# Plugins
echo Fetching neo4j taxomachine plugin
wget --no-verbose -O neo4j-taxo/plugins/taxo.jar http://dev.opentreeoflife.org:/export/taxo.jar

# Fetch and expand database
if [ $FORREAL = yes ]; then
    # 4G, expands to 22G

    wget --no-verbose -O downloads/taxo.db.tgz http://dev.opentreeoflife.org:/export/taxo.db.tgz
    rm -rf db.tmp
    mkdir db.tmp
    tar xzf -C db.tmp downloads/taxo.db.tgz
    mv *.db neo4j-taxo/data/graph.db
fi

# Start the server.  (also need restart on reboot, TBD)
if $FORREAL = yes; then
    neo4j-taxo/bin/neo4j stop
    neo4j-taxo/bin/neo4j start
fi

# ---------- MAKE AVAILABLE VIA APACHE ----------

# File pushed here using rsync, see push.sh
cp -p setup/webapp-config opentree/webapp/private/config 

if [ $FORREAL = yes -a -r opentree/webapp/private/config ]; then

    # If treemachine is running locally, we need to modify the web2py
    # config file to point to localhost instead of dev.opentreeoflife.org.
    cat opentree/webapp/private/config | \
    sed s+dev.opentreeoflife.org/treemachine+localhost/treemachine+ | \
    sed s+dev.opentreeoflife.org/taxomachine+localhost/taxomachine+ \
       > tmp.tmp
    mv tmp.tmp opentree/webapp/private/config

    # Force the web2py python process to restart
    sudo apache2ctl graceful
fi
