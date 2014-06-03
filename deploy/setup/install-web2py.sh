#!/bin/bash

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
    rm -rf repo/opentree/*/sessions/*
    rm -rf repo/phylesystem-api/sessions/*
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
