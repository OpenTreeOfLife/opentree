#!/bin/bash

# Some of this repeats what's found in install-api.sh.  Keep in sync.

# Lots of arguments to make this work.. check to see if we have them all.
if [ "$#" -ne 12 ]; then
    echo "install-web2py-apps.sh missing required parameters (expecting 12)"
    exit 1
fi

OPENTREE_HOST=$1  #Not used; set in functions.sh anyhow
OPENTREE_PUBLIC_DOMAIN=$2
NEO4JHOST=$3      #Not used
CONTROLLER=$4
CURATION_GITHUB_CLIENT_ID=$5
CURATION_GITHUB_REDIRECT_URI=$6
TREEVIEW_GITHUB_CLIENT_ID=$7
TREEVIEW_GITHUB_REDIRECT_URI=$8
TREEMACHINE_BASE_URL=$9
# NOTE that args beyond nine must be referenced in curly braces
TAXOMACHINE_BASE_URL=${10}
OTI_BASE_URL=${11}
OPENTREE_API_BASE_URL=${12}

. setup/functions.sh

setup/install-common.sh $CONTROLLER

echo "Installing web2py applications.  Hostname = $OPENTREE_HOST.  Public-facing domain = $OPENTREE_PUBLIC_DOMAIN"

# **** Begin setup that is common to opentree/curator and api

OTHOME=$PWD
if [ "${PEYOTL_LOG_FILE_PATH:0:1}" != "/" ]; then
    PEYOTL_LOG_FILE_PATH="$OTHOME"/"$PEYOTL_LOG_FILE_PATH"
fi

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

# N.B. Two other files with were already placed via rsync (in push.sh):
#   curator/private/GITHUB_CLIENT_SECRET
#   webapp/private/GITHUB_CLIENT_SECRET

# ---- main webapp (opentree)

configdir=repo/opentree/webapp/private
configtemplate=$configdir/config.example
configfile=$configdir/config

# Replace tokens in example config file to make the active config (assume this always changes)
cp -p $configtemplate $configfile
sed "s+github_client_id = .*+github_client_id = $TREEVIEW_GITHUB_CLIENT_ID+;
     s+github_redirect_uri = .*+github_redirect_uri = $TREEVIEW_GITHUB_REDIRECT_URI+
     s+hostdomain = .*+hostdomain = $OPENTREE_PUBLIC_DOMAIN+;
     s+treemachine = .*+treemachine = $TREEMACHINE_BASE_URL+
     s+taxomachine = .*+taxomachine = $TAXOMACHINE_BASE_URL+
     s+oti = .*+oti = $OTI_BASE_URL+
     s+opentree_api = .*+opentree_api = $OPENTREE_API_BASE_URL+
    " < $configfile > tmp.tmp
mv tmp.tmp $configfile

# ---- curator webapp
configdir=repo/opentree/curator/private
configtemplate=$configdir/config.example
configfile=$configdir/config

# Replace tokens in example config file to make the active config (assume this always changes)
cp -p $configtemplate $configfile
sed "s+github_client_id = .*+github_client_id = $CURATION_GITHUB_CLIENT_ID+;
     s+github_redirect_uri = .*+github_redirect_uri = $CURATION_GITHUB_REDIRECT_URI+
     s+treemachine = .*+treemachine = $TREEMACHINE_BASE_URL+
     s+taxomachine = .*+taxomachine = $TAXOMACHINE_BASE_URL+
     s+oti = .*+oti = $OTI_BASE_URL+
     s+opentree_api = .*+opentree_api = $OPENTREE_API_BASE_URL+
    " < $configfile > tmp.tmp
mv tmp.tmp $configfile

# install ncl a C++ app needed for NEXUS, newick, NeXML -->NexSON conversion
(cd repo/opentree/curator ; ./install-ncl.sh) 

# record the current SHA for ncl
log  Installing NCL at `cd repo/opentree/curator/ncl; git log | head -1`

echo "Apache / web2py restart required (due to app configuration)"

# ---------- INSTALL PYTHON REQUIREMENTS, SYMLINK APPLICATIONS ----------

(cd $APPROOT; pip install -r requirements.txt)

(cd web2py/applications; \
    ln -sf ../../repo/$WEBAPP/webapp ./$WEBAPP; \
    ln -sf ../../repo/$WEBAPP/curator ./)
