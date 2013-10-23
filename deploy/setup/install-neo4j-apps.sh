#!/bin/bash

set -e

total=`df -m . | (read; read fs total used available percent; echo $total)`

if [ $total -lt 80000 ]; then
    echo 1>&2 Disk too small, will do a sham install of tree/taxo
    FORREAL=no
elif [ x$FORREAL = x ]; then
    FORREAL=yes
fi

# Will not run on AWS free tier.  Recommended at least 80G disk and 16G RAM.

echo "`date` Installing treemachine and taxomachine"

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads
mkdir -p repo

if [ ! -r .updated ]; then
    sudo apt-get --assume-yes update
    touch .updated
fi

# ---------- JAVA ----------
if [ `which javac`x = x ]; then
    sudo apt-get --assume-yes install openjdk-7-jre 
    sudo apt-get --assume-yes install openjdk-7-jdk
fi

# Cf. file 'activate' - should be the same
export JAVA_HOME=/usr/lib/jvm/java-7-openjdk-amd64

if [ ! -d $JAVA_HOME ]; then
    echo 1>&2 No directory $JAVA_HOME
    exit 1
fi

# ---------- MAVEN 3 ----------
if [ `which mvn`x = x ]; then
    sudo apt-get install maven
fi

# ---------- NEO4J ----------
if [ ! -r downloads/neo4j.tgz ]; then
    wget --no-verbose -O downloads/neo4j.tgz http://dist.neo4j.org/neo4j-community-1.9.4-unix.tar.gz?edition=community&version=1.9.4&distribution=tarball&dlid=2824963
fi

# ---------- APACHE CONFIG ----------
# shell variable is used below
configfile=web2py/applications/opentree/private/config
cp -p setup/webapp-config $configfile

# ---------- TREEMACHINE / TAXOMACHINE ----------
# Set up neo4j server

function neo4j_app {
    APP=$1

    # Create a copy of neo4j for this app
    if [ ! -x neo4j-$APP/bin/neo4j ] ; then
	tar xzf downloads/neo4j.tgz
	mv neo4j-community-* neo4j-$APP
    fi

    # Get plugin from git repository
    plugin=repo/$APP
    changed=yes
    if [ ! -d $plugin ] ; then
	(cd `dirname $plugin`; git clone https://github.com/OpenTreeOfLife/$APP.git)
    else
	before=`cd $plugin; git log | head -1`
	(cd $plugin; git checkout .; git pull origin master)
	after=`cd $plugin; git log | head -1`
	if [ "$before" = "$after" ] ; then
	    echo "Repository is unchanged since last time"
	    changed=no
	else
	    echo "Repository has changed, rebuilding the plugins .jar file"
	fi
    fi

    # Create the plugins .jar file
    # Compilation takes about 4 minutes... ugh
    jar=opentree-neo4j-plugins-0.0.1-SNAPSHOT.jar
    if [ ! -r neo4j-$APP/plugins/$jar -o $changed = "yes" ]; then
	(cd $plugin; ./mvn_serverplugins.sh)
	mv -f $plugin/target/$jar neo4j-$APP/plugins/
    fi

    # Retrieve and unpack the database
    # treemachine: 6G, expands to 12G (AWS free tier only gives you 8G total)
    # taxomachine: 4G, expands to 20G
    wget --no-verbose -O downloads/$APP.db.tgz.md5.new http://dev.opentreeoflife.org:/export/$APP.db.tgz.md5
    if [ ! -r downloads/$APP.db.tgz.md5 ] || \
       [ ! -r downloads/$APP.db.tgz ] || \
       ! cmp downloads/$APP.db.tgz.md5 downloads/$APP.db.tgz.md5.new; then
        if [ $FORREAL = yes ]; then
	    wget --no-verbose -O downloads/$APP.db.tgz http://dev.opentreeoflife.org:/export/$APP.db.tgz
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
    neo4j-$APP/bin/neo4j stop || true
    neo4j-$APP/bin/neo4j start

    # Configure apache to proxypass the tree/taxo web services to neo4j

    if [ $FORREAL = yes ]; then

	# If treemachine is running locally, we need to modify the web2py
	# config file to point to localhost instead of dev.opentreeoflife.org.
	sed s+dev.opentreeoflife.org/$APP+localhost/$APP+ < $configfile > tmp.tmp
	mv tmp.tmp $configfile

        # Force apache to restart (because of config file change)
        sudo apache2ctl graceful
    fi
}

neo4j_app treemachine
neo4j_app taxomachine

echo "`date` Done"
