#!/bin/bash

# Some of this repeats what's found in install-api.sh.  Keep in sync.

# Lots of arguments to make this work.. check to see if we have them all.
if [ "$#" -ne 10 ]; then
    echo "install-web2py-apps.sh missing required parameters (expecting 10)"
    exit 1
fi

OPENTREE_HOST=$1
OPENTREE_PUBLIC_DOMAIN=$2
NEO4JHOST=$3
CONTROLLER=$4
GITHUB_CLIENT_ID=$5
GITHUB_REDIRECT_URI=$6
TREEMACHINE_BASE_URL=$7
TAXOMACHINE_BASE_URL=$8
OTI_BASE_URL=$9
# NOTE that args beyond nine must be referenced in curly braces
OTOL_API_BASE_URL=${10}

. setup/functions.sh

echo "Installing web2py applications.  Hostname = $OPENTREE_HOST. Neo4j host = $NEO4JHOST. Public-facing domain = $OPENTREE_PUBLIC_DOMAIN"

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

# Make sure that we have the opentree Git repo before manipulating
# files inside of it below

echo "...fetching $WEBAPP repo..."
git_refresh OpenTreeOfLife $WEBAPP || true

# Modify the requirements list
cp -p $APPROOT/requirements.txt $APPROOT/requirements.txt.save
if grep --invert-match "distribute" \
      $APPROOT/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $APPROOT/requirements.txt
fi

# ---------- WEB2PY CONFIGURATION ----------

# The web2py apps need to know their own host names, for
# authentication purposes.  'hostname' doesn't work on EC2 instances,
# so it has to be passed in as a parameter.

# N.B. Another file 'janrain.key' with secret Janrain key was already placed via rsync (in push.sh)
# Also another file 'GITHUB_CLIENT_SECRET'

# ---- main webapp (opentree)

configdir=repo/opentree/webapp/private
configtemplate=$configdir/config.example
configfile=$configdir/config

# Replace tokens in example config file to make the active config (assume this always changes)
cp -p $configtemplate $configfile
sed "s+hostdomain = .*+hostdomain = $OPENTREE_PUBLIC_DOMAIN+;
     s+treemachine = .*+treemachine = $TREEMACHINE_BASE_URL+
     s+taxomachine = .*+taxomachine = $TAXOMACHINE_BASE_URL+
     s+oti = .*+oti = $OTI_BASE_URL+
    " < $configfile > tmp.tmp
mv tmp.tmp $configfile

# ---- curator webapp
configdir=repo/opentree/curator/private
configtemplate=$configdir/config.example
configfile=$configdir/config

# Replace tokens in example config file to make the active config (assume this always changes)
cp -p $configtemplate $configfile
sed "s+github_client_id = .*+github_client_id = $GITHUB_CLIENT_ID+;
     s+github_redirect_uri = .*+github_redirect_uri = $GITHUB_REDIRECT_URI+
     s+treemachine = .*+treemachine = $TREEMACHINE_BASE_URL+
     s+taxomachine = .*+taxomachine = $TAXOMACHINE_BASE_URL+
     s+oti = .*+oti = $OTI_BASE_URL+
     s+otol_api = .*+otol_api = $OTOL_API_BASE_URL+
    " < $configfile > tmp.tmp
mv tmp.tmp $configfile

echo "Apache / web2py restart required (due to app configuration)"

# ---------- INSTALL PYTHON REQUIREMENTS, SYMLINK APPLICATIONS ----------

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
