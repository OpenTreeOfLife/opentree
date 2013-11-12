#!/bin/bash

set -e
. setup/functions.sh

HOST=$1
BRANCH=master

echo "Installing web2py applications.  Hostname = $HOST"
date

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads
mkdir -p repo

# ---------- WEB2PY ----------
if [ ! -d web2py ]; then
    if [ ! -r downloads/web2py_src.zip ]; then
	wget --no-verbose -O downloads/web2py_src.zip \
	  http://www.web2py.com/examples/static/web2py_src.zip
    fi
    unzip downloads/web2py_src.zip
fi

# ---------- OUR VIRTUALENV ----------
# Set up python env
if [ ! -d venv ]; then
    virtualenv venv
fi
source venv/bin/activate

# Why exactly is this needed?  web2py?

if ! grep --silent --invert-match setup/activate .bashrc; then
    echo "source $HOME/setup/activate" >> ~/.bashrc
fi

# ---------- VIRTUALENV + WEB2PY + WSGI ----------

# See http://stackoverflow.com/questions/11758147/web2py-in-apache-mod-wsgi-with-virtualenv
echo <<EOF >/tmp/fragment
activate_this = $PWD'/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))
import sys
sys.path.insert(0, $PWD'/web2py')
EOF

(head -2 web2py/handlers/wsgihandler.py; \
 cat /tmp/fragment; \
 tail -n +3 web2py/handlers/wsgihandler.py) \
   > web2py/wsgihandler.py

rm /tmp/fragment

# ---------- THE WEB APPLICATIONS ----------
# Set up web2py apps as directed in the README.md file

opentree=repo/opentree

# Consider cloning a designated tag, using git clone --branch <tag>

# We clone via https instead of ssh, because ssh cloning fails with
# "Permission denied (publickey)".

git_refresh OpenTreeOfLife opentree $BRANCH || true

# Modify the requirements list
# numpy etc. have all kinds of dependency problems.
cp $opentree/requirements.txt requirements.txt.save
if grep --invert-match "biopython\\|numpy\\|scipy\\|PIL\\|lxml||\distribute" \
      $opentree/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $opentree/requirements.txt
fi

# xslt
# svnversion ?
(cd $opentree; pip install -r requirements.txt)

cp -p $opentree/oauth20_account.py web2py/gluon/contrib/login_methods/
cp -p $opentree/SITE.routes.py web2py/routes.py

(cd web2py/applications; \
    ln -sf ../../repo/opentree/webapp ./opentree; \
    ln -sf ../../repo/opentree/curator ./)

# File pushed here using rsync, see push.sh
configfile=web2py/applications/opentree/private/config

# Not sure, maybe should do this conditionally ??
cp -p setup/webapp-config $configfile

# The web2py apps need to know their own host names, for
# authentication purposes.  'hostname' doesn't work on EC2 instances,
# so it has to be passed in.

sed "s+hostdomain = .*+hostdomain = $HOST+" < $configfile > tmp.tmp
mv tmp.tmp $configfile

# Apache needs to be restarted, probably.
