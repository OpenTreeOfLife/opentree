#!/bin/bash

# Some of this repeats what's found in install-web2py-apps.sh.  Keep in sync.

OPENTREE_HOST=$1
OPENTREE_DOCSTORE=$2
CONTROLLER=$3
OTI_BASE_URL=$4
OPENTREE_API_BASE_URL=$5

. setup/functions.sh

setup/install-common.sh

echo "Installing API"

# ---------- Redis for caching ---------
REDIS_WITH_VERSION="redis-2.8.8"
if ! test -f redis/bin/redis-server ; then
    if ! test -d "downloads/${REDIS_WITH_VERSION}" ; then
        if ! test -f downloads/"${REDIS_WITH_VERSION}.tar.gz" ; then
            wget --no-verbose -O downloads/"${REDIS_WITH_VERSION}.tar.gz" http://download.redis.io/releases/"${REDIS_WITH_VERSION}".tar.gz
        fi
        (cd downloads; \
            tar xfz "${REDIS_WITH_VERSION}.tar.gz")
    fi
    if ! test -d redis/work ; then
        mkdir -p redis/work
        (cd downloads/${REDIS_WITH_VERSION} ; \
            make && make PREFIX="${HOME}/redis" install)
    fi
fi
# ---------- Celery for task queue for deferred tasks ------
if ! which celery
then
    CELERY_VERSION="3.0.20"
    if ! test -d celery-${CELERY_VERSION} ; then
        if ! test -d "downloads/v${CELERY_VERSION}.zip" ; then
            wget --no-verbose -O downloads/v${CELERY_VERSION}.zip https://github.com/celery/celery/archive/v${CELERY_VERSION}.zip
        fi
        (cd downloads; \
            unzip v${CELERY_VERSION}.zip)
        mv downloads/celery-${CELERY_VERSION} celery-${CELERY_VERSION}
    fi
    (cd celery-${CELERY_VERSION} ; \
            python setup.py build ; python setup.py install)
fi

# ---------- API & TREE STORE ----------
# Set up api web app
# Compare install-web2py-apps.sh

WEBAPP=phylesystem-api
APPROOT=repo/$WEBAPP
OTHOME=$PWD

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

if [ "${PEYOTL_LOG_FILE_PATH:0:1}" != "/" ]; then
    PEYOTL_LOG_FILE_PATH="$OTHOME"/"$PEYOTL_LOG_FILE_PATH"
fi

git_refresh OpenTreeOfLife peyotl || true
py_package_setup_install peyotl || true

(cd $APPROOT; pip install -r requirements.txt)
(cd $APPROOT/ot-celery; pip install -r requirements.txt ; python setup.py develop)

(cd web2py/applications; \
    rm -f ./phylesystem ; \
    ln -sf ../../repo/$WEBAPP ./phylesystem)

# ---------- DOC STORE ----------

echo "...fetching $OPENTREE_DOCSTORE repo..."

phylesystem=repo/${OPENTREE_DOCSTORE}_par/$OPENTREE_DOCSTORE
mkdir -p repo/${OPENTREE_DOCSTORE}_par
git_refresh OpenTreeOfLife $OPENTREE_DOCSTORE "$BRANCH" repo/${OPENTREE_DOCSTORE}_par || true

pushd .
    cd $phylesystem
    # All the repos above are cloned via https, but we need to push via
    # ssh to use our deploy keys
    if ! grep "originssh" .git/config ; then
        git remote add originssh git@github.com:OpenTreeOfLife/$OPENTREE_DOCSTORE.git
    fi
popd

pushd .
    cd $APPROOT/private
    cp config.example config
    sed -i -e "s+REPO_PATH+$OTHOME/repo/${OPENTREE_DOCSTORE}_par/$OPENTREE_DOCSTORE+" config
    sed -i -e "s+REPO_PAR+$OTHOME/repo/${OPENTREE_DOCSTORE}_par+" config

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

    #logging stuff
    sed -i -e "s+OPEN_TREE_API_LOGGING_LEVEL+${OPEN_TREE_API_LOGGING_LEVEL}+" config
    sed -i -e "s+OPEN_TREE_API_LOGGING_FORMATTER+${OPEN_TREE_API_LOGGING_FORMATTER}+" config
    if [ "${OPEN_TREE_API_LOGGING_FILEPATH:0:1}" != "/" ]; then
        OPEN_TREE_API_LOGGING_FILEPATH="$OTHOME"/"$OPEN_TREE_API_LOGGING_FILEPATH"
    fi
    sed -i -e "s+OPEN_TREE_API_LOGGING_FILEPATH+${OPEN_TREE_API_LOGGING_FILEPATH}+" config
popd

# N.B. Another file 'GITHUB_CLIENT_SECRET' was already placed via rsync (in push.sh)
# Also 'OPENTREEAPI_OAUTH_TOKEN'

# prompt to add a GitHub webhook (if it's not already there) to nudge my oti service as studies change
pushd .
    # TODO: Pass in credentials for bot user 'opentree' on GitHub, to use the GitHub API for this:
    cd $OTHOME/repo/$WEBAPP/bin
    tokenfile=~/.ssh/OPENTREEAPI_OAUTH_TOKEN
    if [ -r $tokenfile ]; then
        python add_or_update_webhooks.py https://github.com/OpenTreeOfLife/$OPENTREE_DOCSTORE $OPENTREE_API_BASE_URL $tokenfile
    else
        echo "OPENTREEAPI_OAUTH_TOKEN not found (install-api.sh), prompting for manual handling of webhooks."
        python add_or_update_webhooks.py https://github.com/OpenTreeOfLife/$OPENTREE_DOCSTORE $OPENTREE_API_BASE_URL
    fi
popd

echo "copy redis config and start redis"
# Make sure that redis has the up-to-date config from the api repo...
cp $APPROOT/private/ot-redis.config redis/ot-redis.config
# somewhat hacky shutdown and restart redis
echo 'shutdown' | redis/bin/redis-cli
nohup redis/bin/redis-server redis/ot-redis.config &

echo "restarting a celery worker"
celery multi restart worker -A open_tree_tasks -l info

echo "Apache needs to be restarted (API)"
