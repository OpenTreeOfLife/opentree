#!/bin/bash

# Common setup for all web2py applications (opentree, curator, phylesystem-api)

if [ "$#" -ne 1 ]; then
    echo "install-common.sh WNA (expecting 1)"
    exit 1
fi

CONTROLLER=$1

. setup/functions.sh

echo "Installing web2py common"

bash setup/install-web2py.sh

echo "...fetching opentree repo..."
git_refresh OpenTreeOfLife opentree || true

# requirements list ?

(cd web2py/applications; \
    ln -sf ../../repo/$WEBAPP/common ./)

cp -p repo/opentree/oauth20_account.py web2py/gluon/contrib/login_methods/
cp -p repo/opentree/rewrite.py web2py/gluon/
cp -p repo/opentree/SITE.routes.py web2py/routes.py
