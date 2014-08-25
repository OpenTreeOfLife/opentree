# Run this script as an admin user (having 'sudo' privileges)
#  = 'admin' on debian, 'ubuntu' on ubuntu

set -e
# Current directory = home dir for admin user

OPENTREE_HOST=$1

APTGET="sudo apt-get -q --assume-yes --no-install-recommends"

# ---------- UPDATE ----------

if [ ! -r .updated ]; then
    $APTGET update
    touch .updated
fi

if [ `which dialog`x = x ]; then
    # I was hoping this would help with apache2's configure step, but it doesn't
    $APTGET install dialog
fi

# ---------- RSYNC ----------
if [ `which rsync`x = x ]; then
    $APTGET install rsync
fi

# ---------- GCC (for some python packages) ----------
if [ `which gcc`x = x ]; then
    $APTGET install gcc
fi


# ---------- G++ (for NCL, the nexus, newick converter used by the curation tool's import) ----------
if [ `which g++`x = x ]; then
    $APTGET install g++
fi

# ---------- make (for NCL, the nexus, newick converter used by the curation tool's import) ----------
if [ `which make`x = x ]; then
    $APTGET install make
fi

# ---------- autoconf and automake for NCL (curation dependency) ----------
if [ `which autoconf`x = x ]; then
    $APTGET install autotools-dev
fi
# ---------- autoconf and automake for NCL (curation dependency) ----------
if [ `which automake`x = x ]; then
    $APTGET install automake
fi

# ---------- PYTHON-DEV (for some python packages) ----------
if [ ! -r /usr/include/*/Python.h ]; then
    $APTGET install python-dev
fi
# -----G++ (for NCL, the nexus, newick converter used by the curation tool's import) -----
if [ `which g++`x = x ]; then
    $APTGET install g++
fi
# ---------- autoconf and automake for NCL (curation dependency) ----------
if [ `which autoconf`x = x ]; then
    $APTGET install autotools-dev
fi
# ---------- autoconf and automake for NCL (curation dependency) ----------
if [ `which automake`x = x ]; then
    $APTGET install automake
fi


# ---------- APACHE ----------
if [ ! -r /etc/init.d/apache2 ]; then
    echo Installing apache httpd
    # Prompts "do you want to continue?"
    $APTGET install apache2
    echo Done
fi

# Enable the apache proxy module
if [ ! -r /etc/apache2/mods-enabled/proxy.load ]; then
    sudo a2enmod proxy
fi
if [ ! -r /etc/apache2/mods-enabled/proxy_http.load ]; then
    sudo a2enmod proxy_http
fi

# Enable the apache ssl module if SSL certs (and private keys?) are present;
# otherwise disable ssl
if [ -r /etc/ssl/certs/opentree/STAR_opentreeoflife_org.crt ]; then
    sudo a2enmod ssl
else
    sudo a2dismod ssl
fi

# ---------- UNZIP ----------
# unzip is needed for unpacking web2py.  Somebody broke the 'which' program -
# you can't just check the status code any more.
if [ `which unzip`x = x ]; then
    $APTGET install unzip
fi

# ---------- PIP ----------
# Get pip
if [ `which pip`x = x ]; then
    $APTGET install python-pip
fi

# ---------- LIBCURL + PYCURL ---------- 
# oti no longer uses this.
if false; then
    # only needed on debian, may cause problems on ubunutu
    # used by oti indexing script (make sure we have SSL support)
    if [ `which curl`x = x ] || [ `curl-config --feature | grep SSL`x = x ]; then
    #    sudo apt-cache search libcurl-dev
	$APTGET install libcurl4-openssl-dev
	# NOTE that we'll pip-install pycurl inside our venv (in index-doc-store.sh)
    fi
fi

# ---------- GIT ----------
# Get git (so we can clone the opentree repo)
if [ `which git`x = x ]; then
    $APTGET install git
fi

# ---------- WSGI ----------
# Get wsgi (apache / web2py communication)
if [ ! -r /etc/apache2/mods-enabled/wsgi.load ]; then
    $APTGET install libapache2-mod-wsgi
fi

# AWS has python 2.7.3 built in, no need to install it.

# ---------- PYTHON VIRTUALENV ----------
# Get virtualenv
if [ `which virtualenv`x = x ]; then
    $APTGET install python-virtualenv
fi

# ---------- JAVA ----------
if [ `which javac`x = x ]; then
    $APTGET install openjdk-7-jre 
    $APTGET install openjdk-7-jdk
fi

# Cf. file 'activate' - should be the same
export JAVA_HOME=/usr/lib/jvm/java-7-openjdk-amd64

if [ ! -d $JAVA_HOME ]; then
    echo 1>&2 No directory $JAVA_HOME
    exit 1
fi

# ---------- MAVEN 3 ----------
if [ `which mvn`x = x ]; then
    $APTGET install maven
fi

# ---------- LSOF ----------
# neo4j needs this
if [ `which lsof`x = x ]; then
    $APTGET install lsof
fi

# ---------- NTP ----------
if [ ! -r /etc/ntp.conf ]; then
    $APTGET install ntp
fi


# ---------- APACHE VHOST ----------

# Set up apache so that web2py takes over the vhost

# How the apache config (the one found in the deployment setup
# directory) was created: we copied the apache default vhost config
# (000-default) from a fresh EC2 instance, then modified it to make
# web2py work, per instructions found on the web.  See
# /etc/apache2/sites-available/default .
# 
# After adding a second VirtualHost for HTTPS, we moved all common
# configuration to a second file '{apache|opentree}-config-shared', which is
# used in both vhosts via the Include directive.

# The purpose here (of clobbering the default vhost) is to avoid
# having to know all of our own vhost names.  Instead we make opentree
# the default 'vhost'.  The opentree config file gets put into
# place later on in the setup sequence.

sudo rm -f /etc/apache2/sites-enabled/000-default
(cd /etc/apache2/sites-enabled; \
 sudo ln -sf ../sites-available/opentree ./000-opentree)

# ---------- UNPRIVILEGED USER ----------

if [ ! -e ~opentree ]; then
    sudo useradd opentree
    sudo cp -pr /etc/skel ~opentree
    sudo chown -R opentree:opentree ~opentree
    sudo chmod g+sw ~opentree
    sudo chsh -s /bin/bash opentree 
fi

if [ ! -e ~opentree/.ssh ]; then
    sudo mkdir ~opentree/.ssh
    sudo cp -p .ssh/authorized_keys ~opentree/.ssh/
    sudo chmod 700 ~opentree/.ssh/
    sudo chown -R opentree:opentree ~opentree
fi

HOSTFILE=~opentree/hostname
cat <<EOF | sudo bash
    echo "$OPENTREE_HOST" >$HOSTFILE
    chmod go+r $HOSTFILE
    chown opentree $HOSTFILE
EOF
