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
OPENTREE_API_BASE_URL=${10}

. setup/functions.sh

echo "Installing web2py applications.  Hostname = $OPENTREE_HOST. Neo4j host = $NEO4JHOST. Public-facing domain = $OPENTREE_PUBLIC_DOMAIN"

# **** Begin setup that is common to opentree/curator and api

# ---------- WEB2PY ----------

# Install or upgrade web2py, based on a pinned release. (See
# https://github.com/web2py/web2py/releases for all available releases.)
WEB2PY_RELEASE='2.8.2'
# N.B. We should only change WEB2PY_RELEASE after updating the modified web2py files
# listed in the section 'ROUTES AND WEB2PY PATCHES' below, and thorough testing!

if [ ! -d web2py -o  ! -r downloads/web2py_${WEB2PY_RELEASE}_src.zip ]; then
	wget --no-verbose -O downloads/web2py_${WEB2PY_RELEASE}_src.zip \
      https://github.com/web2py/web2py/archive/R-${WEB2PY_RELEASE}.zip
    # clobber any existing web2py installation
    rm -rf ./web2py
    unzip downloads/web2py_${WEB2PY_RELEASE}_src.zip
    # rename to expected 'web2py'
    mv web2py-R-${WEB2PY_RELEASE}/ web2py
    log "Installed web2py R-${WEB2PY_RELEASE}"

    # clear old sessions in all web2py applications (these can cause heisenbugs in web2py upgrades)
    rm -rf repo/opentree/curator/sessions/*
    rm -rf repo/opentree/webapp/sessions/*
    rm -rf repo/opentree/admin/sessions/*
    rm -rf repo/api.opentreeoflife.org/sessions/*
    log "Cleared old sessions in all web2py apps"
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

# the curator app's to_nexml import function
# requires peyotl (after Feb 20). This
# function may move to the API repo, but 
# until it does the curator app needs to
# install peyotl
git_refresh OpenTreeOfLife peyotl || true
py_package_setup_install peyotl || true

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
     s+opentree_api = .*+opentree_api = $OPENTREE_API_BASE_URL+
    " < $configfile > tmp.tmp
mv tmp.tmp $configfile

# install ncl a C++ app needed for NEXUS, newick, NeXML -->NexSON conversion
(cd repo/opentree/curator ; ./install-ncl.sh) 

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
cp -p repo/opentree/rewrite.py web2py/gluon/
cp -p repo/opentree/SITE.routes.py web2py/routes.py


# ---------- RANDOM ----------

# Sort of random.  Nothing depends on this.

if ! grep --silent setup/activate .bashrc; then
    echo "source $HOME/setup/activate" >> ~/.bashrc
fi
