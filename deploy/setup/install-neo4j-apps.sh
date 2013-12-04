#!/bin/bash

set -e
. setup/functions.sh

HOST=$1
BRANCH=master

##### copied JAVA_HOME code from as_admin.sh, should probably be revised to avoid this duplication
# Cf. file 'activate' - should be the same
export JAVA_HOME=/usr/lib/jvm/java-7-openjdk-amd64

if [ ! -d $JAVA_HOME ]; then
    echo 1>&2 No directory $JAVA_HOME
    exit 1
fi

# tbd: maybe allow a different branch for each repo

# Will not run on AWS free tier.  Recommended at least 60G disk and 16G RAM.

echo "`date` Installing treemachine and taxomachine"

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads
mkdir -p repo

# ---------- NEO4J ----------
if [ ! -r downloads/neo4j.tgz ]; then
    wget --no-verbose -O downloads/neo4j.tgz http://dist.neo4j.org/neo4j-community-1.9.5-unix.tar.gz?edition=community&version=1.9.5&distribution=tarball&dlid=2824963
fi

# ---------- NEO4J WITH TREEMACHINE / TAXOMACHINE PLUGINS ----------
# Set up neo4j services

#if git_refresh FePhyFoFum jade master || [ ! -r repo/jade/target/*.jar ]; then
if git_refresh FePhyFoFum jade master || [ ! -d ~/.m2/repository/org/opentree/jade ]; then
    (cd repo/jade; sh mvn_install.sh)
fi

#if git_refresh OpenTreeOfLife ot-base $BRANCH || [ ! -r repo/ot-base/target/*.jar ]; then
if git_refresh OpenTreeOfLife ot-base master || [ ! -d ~/.m2/repository/org/opentree/ot-base ]; then
    (cd repo/ot-base; sh mvn_install.sh)
fi

if git_refresh OpenTreeOfLife taxomachine master || [ ! -d ~/.m2/repository/org/opentree/taxomachine ]; then
    (cd repo/taxomachine; sh mvn_install.sh)
fi

#jar=opentree-neo4j-plugins-0.0.1-SNAPSHOT.jar
VERSION=0.0.1-SNAPSHOT

function make_neo4j_plugin {
    
    APP=$1
    jar=$APP-neo4j-plugins-$VERSION.jar
    echo "installing plugin for" $APP

    # Create a copy of neo4j for this app
    if [ ! -x neo4j-$APP/bin/neo4j ] ; then
	tar xzf downloads/neo4j.tgz
	mv neo4j-community-* neo4j-$APP
    fi

    # Get plugin from git repository
    if git_refresh OpenTreeOfLife $APP $BRANCH || [ ! -r neo4j-$APP/plugins/$jar ]; then
    
        echo "attempting to recompile " $APP " plugins"
        # Create and install the plugins .jar file
        # Compilation takes about 4 minutes... ugh
        (cd repo/$APP; ./mvn_serverplugins.sh)

        running_before=yes
            ./neo4j-$APP/bin/neo4j status || running_before=no
        if [ running_before = yes ]; then ./neo4j-$APP/bin/neo4j stop; fi
        cp -p -f repo/$APP/target/$jar neo4j-$APP/plugins/
        if [ running_before = yes ]; then ./neo4j-$APP/bin/neo4j start; fi
    fi
}

# Backup method in case the build fails for any reason

function fetch_neo4j_plugin {
    APP=$1
    jar=$APP-neo4j-plugins-$VERSION.jar
    wget --no-verbose -O neo4j-$APP/plugins/$jar http://files.opentreeoflife.org:/export/$APP.jar
}

make_neo4j_plugin treemachine || fetch_neo4j_plugin taxomachine

make_neo4j_plugin taxomachine || fetch_neo4j_plugin taxomachine

make_neo4j_plugin oti || fetch_neo4j_plugin oti

# Set taxomachine ports before starting it up

#org.neo4j.server.webserver.port=7474
#org.neo4j.server.webserver.https.port=7473
sed s+7474+7476+ < neo4j-taxomachine/conf/neo4j-server.properties | \
sed s+7473+7475+ > props.tmp
mv props.tmp neo4j-taxomachine/conf/neo4j-server.properties

# Change oti ports as well
sed s+7474+7478+ < neo4j-oti/conf/neo4j-server.properties | \
sed s+7473+7477+ > props.tmp
mv props.tmp neo4j-oti/conf/neo4j-server.properties


# ---------- THE NEO4J DATABASES ----------

function fetch_neo4j_db {
    APP=$1

    # Retrieve and unpack the database
    # treemachine: 6G, expands to 12G (AWS free tier only gives you 8G total)
    # taxomachine: 4G, expands to 20G
    wget --no-verbose -O downloads/$APP.db.tgz.md5.new \
      http://files.opentreeoflife.org:/export/$APP.db.tgz.md5
    if [ ! -r downloads/$APP.db.tgz.md5 ] || \
       [ ! -r downloads/$APP.db.tgz ] || \
       ! cmp downloads/$APP.db.tgz.md5 downloads/$APP.db.tgz.md5.new; then
        if [ $FORREAL = yes ]; then
	    time \
	    wget --no-verbose -O downloads/$APP.db.tgz \
	      http://files.opentreeoflife.org:/export/$APP.db.tgz
	    mv downloads/$APP.db.tgz.md5.new downloads/$APP.db.tgz.md5 

	    install_neo4j_db $APP
	    setup/install_db.sh $APP
        else
            echo "Should load $APP database, but not doing so"
        fi
    fi
}

if false; then
    total=`df -m . | (read; read fs total used available percent; echo $total)`
    if [ $total -lt 60000 ]; then
	echo 1>&2 "Disk too small, will do a sham install of tree/taxo"
	FORREAL=no
    elif [ x$FORREAL = x ]; then
	FORREAL=yes
    fi

    fetch_neo4j_db treemachine
    fetch_neo4j_db taxomachine
fi

# setup oti database
#if false; then
if true; then
    echo "attempting to setup the oti database"
    ./neo4j-oti/bin/neo4j restart
#    echo <(ls repo/oti/index_current_repo.py)
    python repo/oti/index_current_repo.py http://localhost:7478/db/data
    echo "oti setup run"
fi



echo "`date` Done"

# Apache needs to be restarted
