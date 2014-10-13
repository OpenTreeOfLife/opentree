#!/bin/bash

# Common setup for all web2py applications (opentree, curator, phylesystem-api)

if [ "$#" -ne 2 ]; then
    echo "install-common.sh WNA (expecting 2)"
    exit 1
fi

OPENTREE_DEFAULT_APPLICATION=$1
CONTROLLER=$2

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

TMP=/tmp/tmp.tmp
echo default_application should be "$OPENTREE_DEFAULT_APPLICATION"
sed -e "s+default_application='.*'+default_application='$OPENTREE_DEFAULT_APPLICATION'+" \
   repo/opentree/SITE.routes.py >$TMP
cp $TMP web2py/routes.py
rm $TMP
grep default_ web2py/routes.py

# Kludge in case OPENTREE_DEFAULT_APPLICATION is set to 'welcome' or (more likely) 'phylesystem'
cp -p repo/opentree/webapp/static/robots.txt web2py/applications/welcome/static/
cp -p repo/opentree/webapp/static/robots.txt web2py/applications/phylesystem/static/
