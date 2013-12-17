#!/bin/bash

OPENTREE_HOST=$1
NEO4JHOST=$2
CONTROLLER=$3
BRANCH=master

. setup/functions.sh

echo "Installing API"

# ---------- API & TREE STORE ----------

api=repo/api.opentreeoflife.org

echo "...fetching api.opentreeoflife.org repo..."
git_refresh OpenTreeOfLife api.opentreeoflife.org $BRANCH || true

echo "... fetching treenexus repo..."

treenexus=repo/treenexus
git_refresh OpenTreeOfLife treenexus $BRANCH || true

pushd .
cd $treenexus
# All the repos above are cloned via https, but we need to push via
# ssh to use our deploy keys
if ! grep "originssh" .git/config ; then
    git remote add originssh git@github.com:OpenTreeOfLife/treenexus.git
fi
popd

pushd .
cd $api/private
cp config.example config
sed -i -e 's+REPO_PATH+/home/opentree/repo/treenexus+' config

# specify our remote to push to, which is added to treenexus above
sed -i -e 's+REPO_REMOTE+originssh+' config

# This wrapper script allows us to specify an ssh key to use in git pushes
sed -i -e 's+GIT_SSH+/home/opentree/repo/api.opentreeoflife.org/bin/git.sh+' config
# this is the file location of the SSH key that is used in git.sh
sed -i -e 's+PKEY+/home/opentree/.ssh/opentree+' config


# oti search runs on 7478
sed -i -e 's+7474+7478+' config

popd

# Modify the requirements list
cp $api/requirements.txt requirements-api.txt.save
if grep --invert-match "distribute" \
      $api/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $api/requirements.txt
fi

(cd $api; pip install -r requirements.txt)

(cd web2py/applications; \
    ln -sf ../../repo/api.opentreeoflife.org ./api)

# Apache needs to be restarted.