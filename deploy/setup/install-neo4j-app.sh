#!/bin/bash

. setup/functions.sh

CONTROLLER=$1
WHICH_APP=$2

# tbd: maybe allow a different branch for each repo

# Will not run on AWS free tier.  Recommended at least 60G disk and 16G RAM.

# Uses $CONTROLLER

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads
mkdir -p repo

echo JAVA_HOME is $JAVA_HOME

# ---------- NEO4J ----------
if [ ! -r downloads/neo4j.tgz ]; then
    wget --no-verbose -O downloads/neo4j.tgz "http://dist.neo4j.org/neo4j-community-1.9.5-unix.tar.gz?edition=community&version=1.9.5&distribution=tarball&dlid=2824963"
fi

# ---------- NEO4J WITH TREEMACHINE / TAXOMACHINE PLUGINS ----------
# Set up neo4j services

if git_refresh FePhyFoFum jade || [ ! -d ~/.m2/repository/org/opentree/jade ]; then
    (cd repo/jade; sh mvn_install.sh)
fi

if git_refresh OpenTreeOfLife ot-base || [ ! -d ~/.m2/repository/org/opentree/ot-base ]; then
    (cd repo/ot-base; sh mvn_install.sh)
fi

if git_refresh OpenTreeOfLife taxomachine || [ ! -d ~/.m2/repository/org/opentree/taxomachine ]; then
    (cd repo/taxomachine; sh mvn_install.sh)
fi

#jar=opentree-neo4j-plugins-0.0.1-SNAPSHOT.jar
VERSION=0.0.1-SNAPSHOT

function make_neo4j_instance {
    
    APP=$1
    APORT=$2
    BPORT=$3
    jar=$APP-neo4j-plugins-$VERSION.jar
    echo "installing plugin for" $APP

    # Create a copy of neo4j for this app
    if [ ! -x neo4j-$APP/bin/neo4j ] ; then
        echo "installing neo4j for" $APP
        tar xzf downloads/neo4j.tgz
        mv neo4j-community-* neo4j-$APP
    fi

    # Stop any running server.  There may or may not be a database.
    # N.B. We do this regardless of whether there has been a change in its
    # repo, since otherwise apache may fail to proxy requests to this app.
    if ./neo4j-$APP/bin/neo4j status; then
        ./neo4j-$APP/bin/neo4j stop
    fi

    # Get plugin from git repository
    if git_refresh OpenTreeOfLife $APP || [ ! -r neo4j-$APP/plugins/$jar ]; then
    
        echo "attempting to recompile "$APP" plugins"
        # Create and install the plugins .jar file
        # Compilation takes about 4 minutes... ugh
        (cd repo/$APP; ./mvn_serverplugins.sh)

	if false; then
            # There was some question as to whether the above code worked.
	    # I'm keeping the following replacement code for a while, just in case.
	    # Stop any running server.  There may or may not be a database.
	    # N.B. Theo 'neo4j status' command returns a phrase like this (for a stopped instance):
	    #    Neo4j Server is not running
	    # ... or this (for a running instance):
	    #    Neo4j Server is running at pid #####
	    if [[ "`./neo4j-$APP/bin/neo4j status`" =~ "is running" ]]; then
		./neo4j-$APP/bin/neo4j stop
            fi
        fi

        # Move new plugin code into place
        cp -p -f repo/$APP/target/$jar neo4j-$APP/plugins/

        # Replace defaults ports with ports appropriate for this application
        #org.neo4j.server.webserver.port=7474
        #org.neo4j.server.webserver.https.port=7473
        cat neo4j-$APP/conf/neo4j-server.properties | \
        sed s+7474+$APORT+ | \
        sed s+7473+$BPORT+ | \
	sed s+org.neo4j.server.http.log.enabled=false+org.neo4j.server.http.log.enabled=true+ \
	  > props.tmp
        mv props.tmp neo4j-$APP/conf/neo4j-server.properties
    fi

    # Start or restart the server
    echo "Starting $APP neo4j server"
    ./neo4j-$APP/bin/neo4j start
    log "Started $APP"
}

case $WHICH_APP in
    oti) 	 make_neo4j_instance oti         7478 7477 ;;
    treemachine) make_neo4j_instance treemachine 7474 7473 ;;
    taxomachine) make_neo4j_instance taxomachine 7476 7475 ;;
esac


log "Finished installing neo4j instances"

# Apache needs to be restarted
