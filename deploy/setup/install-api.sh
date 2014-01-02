#!/bin/bash

OPENTREE_HOST=$1
OPENTREE_DOCSTORE=$2
CONTROLLER=$3
BRANCH=master

. setup/functions.sh

echo "Installing API"

# ---------- API & TREE STORE ----------
# Set up api web app
# Compare install-web2py-apps.sh

WEBAPP=api.opentreeoflife.org
APPROOT=repo/$WEBAPP

# This is required to make "git pull" work correctly
git config --global user.name "OpenTree API"
git config --global user.email api@opentreeoflife.org

echo "...fetching $WEBAPP repo..."
git_refresh OpenTreeOfLife $WEBAPP $BRANCH || true

# Modify the requirements list
cp -p $APPROOT/requirements.txt $APPROOT/requirements.txt.save
if grep --invert-match "distribute" \
      $APPROOT/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $APPROOT/requirements.txt
fi

(cd $APPROOT; pip install -r requirements.txt)

(cd web2py/applications; \
    ln -sf ../../repo/$WEBAPP ./api)

# ---------- DOC STORE ----------

echo "...fetching $OPENTREE_DOCSTORE repo..."

treenexus=repo/$OPENTREE_DOCSTORE
git_refresh OpenTreeOfLife $OPENTREE_DOCSTORE $BRANCH || true

pushd .
    cd $treenexus
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

    # Access oti search from port 7478 on localhost
    sed -i -e "s+7474+7478+" config
popd

echo "Apache needs to be restarted (API)"
