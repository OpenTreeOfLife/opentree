#!/bin/bash

OPENTREE_HOST=$1
OPENTREE_PUBLIC_DOMAIN=$2
NEO4JHOST=$3
CONTROLLER=$4
BRANCH=master

. setup/functions.sh

echo "Installing web2py applications.  Hostname = $OPENTREE_HOST. Public-facing domain = $OPENTREE_PUBLIC_DOMAIN"

# **** Begin setup that is common to opentree/curator and api

# ---------- WEB2PY ----------
if [ ! -d web2py ]; then
    if [ ! -r downloads/web2py_src.zip ]; then
	wget --no-verbose -O downloads/web2py_src.zip \
	  http://www.web2py.com/examples/static/web2py_src.zip
    fi
    unzip downloads/web2py_src.zip
    log "Installed web2py"
fi

# ---------- VIRTUALENV + WEB2PY + WSGI ----------

# Patch web2py's wsgihandler so that it does the equivalent of 'venv/activate'
# when started by Apache.

# See http://stackoverflow.com/questions/11758147/web2py-in-apache-mod-wsgi-with-virtualenv
# Indentation (or lack thereof) is critical
cat <<EOF >fragment.tmp
activate_this = '$PWD/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))
import sys
sys.path.insert(0, '$PWD/web2py')
EOF

# This is pretty darn fragile!  But if it fails, it will fail big -
# the web apps won't work at all.

(head -2 web2py/handlers/wsgihandler.py && \
 cat fragment.tmp && \
 tail -n +3 web2py/handlers/wsgihandler.py) \
   > web2py/wsgihandler.py

rm fragment.tmp


# ---------- BROWSER & CURATOR WEBAPPS ----------
# Set up web2py apps as directed in the README.md file
# Compare install-api.sh

WEBAPP=opentree
APPROOT=repo/$WEBAPP

echo "...fetching $WEBAPP repo..."
git_refresh OpenTreeOfLife $WEBAPP $BRANCH || true

# Modify the requirements list
cp -p $APPROOT/requirements.txt $APPROOT/requirements.txt.save
if grep --invert-match "distribute" \
      $APPROOT/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $APPROOT/requirements.txt
fi

# ---------- WEB2PY CONFIGURATION ----------

configfile=repo/opentree/webapp/private/config

# Config file pushed here using rsync, see push.sh
cp -p setup/webapp-config $configfile

# N.B. Another file 'janrain.key' with secret Janrain key was already placed via rsync (in push.sh)

# The web2py apps need to know their own host names, for
# authentication purposes.  'hostname' doesn't work on EC2 instances,
# so it has to be passed in as a parameter.

sed "s+hostdomain = .*+hostdomain = $OPENTREE_PUBLIC_DOMAIN+" < $configfile > tmp.tmp
if ! cmp -s tmp.tmp $configfile; then
    mv tmp.tmp $configfile
    echo "Apache / web2py restart required (host name)"
fi

# ---------- CALLING OUT TO NEO4J FROM PYTHON AND JAVASCRIPT ----------

# TBD: Need more fine-grained control so that different neo4j services
# can live on different hosts.

# Modify the web2py config file to point to the host that's running
# treemachine and taxomachine.

changed=no
if [ x$NEO4JHOST != x ]; then
    for APP in treemachine taxomachine oti; do
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
    echo "Apache / web2py restart required (links to neo4j services)"
fi

# **** End web2py setup that is common to opentree/curator and api

(cd $APPROOT; pip install -r requirements.txt)

(cd web2py/applications; \
    ln -sf ../../repo/$WEBAPP/webapp ./$WEBAPP; \
    ln -sf ../../repo/$WEBAPP/curator ./)


# ---------- ROUTES AND WEB2PY PATCHES ----------
# These require a fresh pull of the opentree repo (above)

cp -p repo/opentree/oauth20_account.py web2py/gluon/contrib/login_methods/
cp -p repo/opentree/rpx_account.py web2py/gluon/contrib/login_methods/
cp -p repo/opentree/SITE.routes.py web2py/routes.py


# ---------- RANDOM ----------

# Sort of random.  Nothing depends on this.

if ! grep --silent setup/activate .bashrc; then
    echo "source $HOME/setup/activate" >> ~/.bashrc
fi
