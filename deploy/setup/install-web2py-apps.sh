#!/bin/bash

set -e
. setup/functions.sh

HOST=$1
NEO4JHOST=$2
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

# The following helps establish the environment when web2py is fired
# up by Apache via WSGI - I think

if ! grep --silent setup/activate .bashrc; then
    echo "source $HOME/setup/activate" >> ~/.bashrc
fi

# ---------- VIRTUALENV + WEB2PY + WSGI ----------

# See http://stackoverflow.com/questions/11758147/web2py-in-apache-mod-wsgi-with-virtualenv
cat <<EOF >fragment.tmp
activate_this = '$PWD/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))
import sys
sys.path.insert(0, '$PWD/web2py')
EOF

# This is pretty darn fragile!  But if it fails, it will fail big -
# the web apps won't work at all.

(head -2 web2py/handlers/wsgihandler.py; \
 cat fragment.tmp; \
 tail -n +3 web2py/handlers/wsgihandler.py) \
   > web2py/wsgihandler.py

rm fragment.tmp

# ---------- THE WEB APPLICATIONS ----------
# Set up web2py apps as directed in the README.md file

opentree=repo/opentree
api=repo/api.opentreeoflife.org

# Consider cloning a designated tag, using git clone --branch <tag>

echo "...fetching opentree repo (main webapp and curator)..."
git_refresh OpenTreeOfLife opentree $BRANCH || true
echo "...fetching api.opentreeoflife.org repo..."
git_refresh OpenTreeOfLife api.opentreeoflife.org $BRANCH || true

# Modify the requirements list
# numpy etc. have all kinds of dependency problems.
cp $opentree/requirements.txt requirements-opentree.txt.save
if grep --invert-match "distribute" \
      $opentree/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $opentree/requirements.txt
fi
cp $api/requirements.txt requirements-api.txt.save
if grep --invert-match "distribute" \
      $api/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $api/requirements.txt
fi

# xslt
# svnversion ?
(cd $opentree; pip install -r requirements.txt)
(cd $api; pip install -r requirements.txt)

cp -p $opentree/oauth20_account.py web2py/gluon/contrib/login_methods/
cp -p $opentree/SITE.routes.py web2py/routes.py

(cd web2py/applications; \
    ln -sf ../../repo/opentree/webapp ./opentree; \
    ln -sf ../../repo/api.opentreeoflife.org ./api; \
    ln -sf ../../repo/opentree/curator ./)

# File pushed here using rsync, see push.sh
configfile=web2py/applications/opentree/private/config

cp -p setup/webapp-config $configfile

# The web2py apps need to know their own host names, for
# authentication purposes.  'hostname' doesn't work on EC2 instances,
# so it has to be passed in.

changed=no

sed "s+hostdomain = .*+hostdomain = $HOST+" < $configfile > tmp.tmp
if ! cmp -s tmp.tmp $configfile; then
    mv tmp.tmp $configfile
    changed=yes
fi

# There will be additional edits to the config file if a neo4j
# database gets installed locally.

# Modify the web2py config file to point to the host that's running
# treemachine and taxomachine.

if [ x$NEO4JHOST != x ]; then
    for APP in treemachine taxomachine; do
        sed "s+$APP = .*+$APP = http://$NEO4JHOST/$APP+" < $configfile > tmp.tmp
	if ! cmp -s tmp.tmp $configfile; then
            mv tmp.tmp $configfile
	    changed=yes
	else
	    echo "Sed failed !?"
	fi
    done
else
    echo "No NEO4JHOST !?"
fi
if [ $changed = yes ]; then
    echo "Apache / web2py restart required"
fi

# Apache needs to be restarted.
