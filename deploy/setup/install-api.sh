#!/bin/bash

# Some of this repeats what's found in install-web2py-apps.sh.  Keep in sync.

OPENTREE_HOST=$1
OPENTREE_DOCSTORE=$2
CONTROLLER=$3
OTI_BASE_URL=$4

. setup/functions.sh

echo "Installing API"

# Required from install-web2py-apps.sh:
#  Fetch and set up web2py
#  Virtualenv
#  WSGI handler

# ---------- API & TREE STORE ----------
# Set up api web app
# Compare install-web2py-apps.sh

WEBAPP=api.opentreeoflife.org
APPROOT=repo/$WEBAPP

# This is required to make "git pull" work correctly
git config --global user.name "OpenTree API"
git config --global user.email api@opentreeoflife.org

echo "...fetching $WEBAPP repo..."
git_refresh OpenTreeOfLife $WEBAPP || true

# Modify the requirements list
cp -p $APPROOT/requirements.txt $APPROOT/requirements.txt.save
if grep --invert-match "distribute" \
      $APPROOT/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $APPROOT/requirements.txt
fi

git_refresh OpenTreeOfLife peyotl || true
py_package_setup_install peyotl || true

(cd $APPROOT; pip install -r requirements.txt)

(cd web2py/applications; \
    ln -sf ../../repo/$WEBAPP ./api)

# ---------- DOC STORE ----------

echo "...fetching $OPENTREE_DOCSTORE repo..."

phylesystem=repo/$OPENTREE_DOCSTORE
git_refresh OpenTreeOfLife $OPENTREE_DOCSTORE $BRANCH || true

pushd .
    cd $phylesystem
    # All the repos above are cloned via https, but we need to push via
    # ssh to use our deploy keys
    if ! grep "originssh" .git/config ; then
	git remote add originssh git@github.com:OpenTreeOfLife/$OPENTREE_DOCSTORE.git
    fi
popd

pushd .
    OTHOME=~opentree

    cd $APPROOT/private
    cp config.example config
    sed -i -e "s+REPO_PATH+$OTHOME/repo/$OPENTREE_DOCSTORE+" config

    # Specify our remote to push to, which is added to local repo above
    sed -i -e "s+REPO_REMOTE+originssh+" config

    # This wrapper script allows us to specify an ssh key to use in git pushes
    sed -i -e "s+GIT_SSH+$OTHOME/repo/$WEBAPP/bin/git.sh+" config

    # This is the file location of the SSH key that is used in git.sh
    sed -i -e "s+PKEY+$OTHOME/.ssh/opentree+" config

    # Access oti search from shared server-config variable
    sed -i -e "s+OTI_BASE_URL+$OTI_BASE_URL+" config

    # Define the public URL of the docstore repo (used for updating oti)
    # N.B. Because of limitations oti's index_current_repo.py, this is
    # always one of our public repos on GitHub.
    sed -i -e "s+OPENTREE_DOCSTORE_URL+https://github.com/OpenTreeOfLife/$OPENTREE_DOCSTORE+" config
popd

# N.B. Another file 'GITHUB_CLIENT_SECRET' was already placed via rsync (in push.sh)

echo "Apache needs to be restarted (API)"
