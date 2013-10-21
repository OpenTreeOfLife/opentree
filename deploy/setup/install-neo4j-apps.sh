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

# ---------- JAVA ----------
if [ `which javac`x = x ]; then
    sudo apt-get --assume-yes install openjdk-7-jre openjdk-7-jdk
fi

# Cf. file 'activate'
export JAVA_HOME=/usr/lib/jvm/default-java

# ---------- DEBIAN ARCHIVE SECURITY ----------
# I tried to do this (the --force-yes below is not secure) but it didn't work.
# W: GPG error: http://ppa.launchpad.net precise Release: The following signatures 
#  couldn't be verified because the public key is not available: NO_PUBKEY B70731143DD9F856
# sudo apt-get install debian-archive-keyring

# ---------- MAVEN 3 ----------
if [ `which mvn`x = x ]; then
    sudo apt-get install maven

elif false; then
    # http://stackoverflow.com/questions/15630055/how-to-install-maven-3-on-ubuntu-12-04-12-10-13-04-by-using-apt-get
    if ! grep --quiet maven3 /etc/apt/sources.list ; then
        (echo "echo deb http://ppa.launchpad.net/natecarlson/maven3/ubuntu precise main >>/etc/apt/sources.list"; \
	 echo "echo deb-src http://ppa.launchpad.net/natecarlson/maven3/ubuntu precise main >>/etc/apt/sources.list") |
	 sudo bash
        sudo apt-get --assume-yes update
    fi
    # This is awful... it seems to be loading maven2, and there's tons of duplicate classes
    # java.lang.NoClassDefFoundError: org/sonatype/aether/graph/Dependency
    sudo apt-get --assume-yes --force-yes install maven3
    sudo ln -sf /usr/share/maven3/bin/mvn /usr/bin/mvn

elif false; then
    a=apache-maven-3.0.5-bin.tar.gz
    wget --no-verbose -O downloads/$a http://apache.cs.utah.edu/maven/maven-3/3.0.5/binaries/$a
    (cd downloads && tar xzf $a)
    export PATH=$PWD/downloads/apache-maven-3.0.5/bin:$PATH
fi

# ---------- NEO4J ----------
if [ ! -r downloads/neo4j.tgz ]; then
    wget --no-verbose -O downloads/neo4j.tgz http://dist.neo4j.org/neo4j-community-1.9.4-unix.tar.gz?edition=community&version=1.9.4&distribution=tarball&dlid=2824963
fi

# ---------- TREEMACHINE / TAXOMACHINE ----------
# Set up neo4j server

function neo4j_app {
    APP=$1

    # Get plugin from git repository
    plugin=repo/$APP
    if [ ! -d $plugin ] ; then
	(cd `dirname $plugin`; git clone https://github.com/OpenTreeOfLife/$APP.git)
    else
	(cd $plugin; git checkout .; git pull origin master)
    fi

    # Create an instance of neo4j
    if [ ! -x neo4j-$APP/bin/neo4j ] ; then
	tar xzf downloads/neo4j.tgz
	mv neo4j-community-* neo4j-$APP
    fi

    # Create the plugins .jar file
    # Compilation takes about 4 minutes... ugh
    jar=opentree-neo4j-plugins-0.0.1-SNAPSHOT.jar
    if [ ! -r neo4j-$APP/plugins/$jar ]; then
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
	    tar xzf -C db.tmp downloads/$APP.db.tgz
	    # Not sure what the db directory will be called;
	    # irregular, and different between tree and taxo
	    mv db.tmp/* neo4j-$APP/data/graph.db
        else
            echo "Should load $APP database, but not doing so"
        fi
    fi

    # Start the server.  (also need restart on reboot, TBD)
    if [ $FORREAL = yes ]; then
	neo4j-$APP/bin/neo4j stop
	neo4j-$APP/bin/neo4j start
    fi
}

neo4j_app treemachine
neo4j_app taxomachine

# ---------- MAKE AVAILABLE VIA APACHE ----------

# File pushed here using rsync, see push.sh
configfile=web2py/applications/opentree/private/config

if [ ! -r $configfile ]; then
    cp -p setup/webapp-config $configfile
fi

if [ $FORREAL = yes ]; then

    # If treemachine is running locally, we need to modify the web2py
    # config file to point to localhost instead of dev.opentreeoflife.org.
    cat $configfile | \
    sed s+dev.opentreeoflife.org/treemachine+localhost/treemachine+ | \
    sed s+dev.opentreeoflife.org/taxomachine+localhost/taxomachine+ \
       > tmp.tmp
    mv tmp.tmp $configfile

    # Force the web2py python process to restart
    sudo apache2ctl graceful
fi
