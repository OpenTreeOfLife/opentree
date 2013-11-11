#!/bin/bash

set -e
. setup/functions.sh

HOST=$1

total=`df -m . | (read; read fs total used available percent; echo $total)`
if [ $total -lt 60000 ]; then
    echo 1>&2 "Disk too small, will do a sham install of tree/taxo"
    FORREAL=no
elif [ x$FORREAL = x ]; then
    FORREAL=yes
fi

# Will not run on AWS free tier.  Recommended at least 60G disk and 16G RAM.

echo "`date` Installing treemachine and taxomachine"

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads
mkdir -p repo

# ---------- NEO4J ----------
if [ ! -r downloads/neo4j.tgz ]; then
    wget --no-verbose -O downloads/neo4j.tgz http://dist.neo4j.org/neo4j-community-1.9.4-unix.tar.gz?edition=community&version=1.9.4&distribution=tarball&dlid=2824963
fi

# ---------- WEB2PY CONFIG ----------
# shell variable is used below
configfile=web2py/applications/opentree/private/config
if [ ! -r $configfile ] ; then
    cp -p setup/webapp-config $configfile
fi

# ---------- NEO4J WITH TREEMACHINE / TAXOMACHINE PLUGINS ----------
# Set up neo4j services

if git_refresh FePhyFoFum jade || [ ! -r repo/jade/target/*.jar ]; then
    (cd repo/jade; sh mvn_install.sh)
fi

if git_refresh OpenTreeOfLife ot-base || [ ! -r repo/ot-base/*.jar ]; then
    (cd repo/ot-base; sh mvn_install.sh)
fi

jar=opentree-neo4j-plugins-0.0.1-SNAPSHOT.jar

function make_neo4j_plugin {
    APP=$1

    # Create a copy of neo4j for this app
    if [ ! -x neo4j-$APP/bin/neo4j ] ; then
	tar xzf downloads/neo4j.tgz
	mv neo4j-community-* neo4j-$APP
    fi

    # Get plugin from git repository
    if git_refresh OpenTreeOfLife $APP || [ ! -r neo4j-$APP/plugins/$jar ]; then
        # Create and install the plugins .jar file
        # Compilation takes about 4 minutes... ugh
	(cd repo/$APP; ./mvn_serverplugins.sh)
	cp -p -f repo/$APP/target/$jar neo4j-$APP/plugins/
    fi
}

function fetch_neo4j_plugin {
    APP=$1
    wget --no-verbose -O neo4j-$APP/plugins/$jar http://files.opentreeoflife.org:/export/$APP.jar
}

make_neo4j_plugin treemachine

if false; then
    fetch_neo4j_plugin taxomachine
else
    make_neo4j_plugin taxomachine
fi

# ---------- THE NEO4J DATABASES ----------

function fetch_neo4j_db {
    APP=$1

    neo4j-$APP/bin/neo4j stop || true

    # Retrieve and unpack the database
    # treemachine: 6G, expands to 12G (AWS free tier only gives you 8G total)
    # taxomachine: 4G, expands to 20G
    wget --no-verbose -O downloads/$APP.db.tgz.md5.new http://files.opentreeoflife.org:/export/$APP.db.tgz.md5
    if [ ! -r downloads/$APP.db.tgz.md5 ] || \
       [ ! -r downloads/$APP.db.tgz ] || \
       ! cmp downloads/$APP.db.tgz.md5 downloads/$APP.db.tgz.md5.new; then
        if [ $FORREAL = yes ]; then
	    time \
	    wget --no-verbose -O downloads/$APP.db.tgz http://files.opentreeoflife.org:/export/$APP.db.tgz
	    mv downloads/$APP.db.tgz.md5.new downloads/$APP.db.tgz.md5 
	    rm -rf db.tmp
	    mkdir db.tmp
	    tar --directory=db.tmp -xzf downloads/$APP.db.tgz
	    # Not sure what the db directory will be called;
	    # irregular, and different between tree and taxo
	    rm -rf neo4j-$APP/data/graph.db
	    mv db.tmp/* neo4j-$APP/data/graph.db
        else
            echo "Should load $APP database, but not doing so"
        fi
    fi

    # Start the server.  (also need restart on reboot, TBD)
    neo4j-$APP/bin/neo4j start

    # Configure apache to proxypass the tree/taxo web services to neo4j

    if [ $FORREAL = yes ]; then

	# If treemachine is running locally, we need to modify the web2py
	# config file to point to localhost instead of dev.opentreeoflife.org.
	sed s+dev.opentreeoflife.org/$APP+$HOST/$APP+ < $configfile > tmp.tmp
	mv tmp.tmp $configfile
    fi
}

fetch_neo4j_db treemachine
fetch_neo4j_db taxomachine


#org.neo4j.server.webserver.port=7474
#org.neo4j.server.webserver.https.port=7473
sed s+7474+7476+ < neo4j-taxomachine/conf/neo4j-server.properties | \
sed s+7473+7475+ > props.tmp
mv props.tmp neo4j-taxomachine/conf/neo4j-server.properties

echo "`date` Done"

# Apache needs to be restarted
