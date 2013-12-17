#!/bin/sh

# TBD: Should take as an argument a command to execute, e.g. update
# web2py without touch neo4j, or vice versa, or upload a new version
# of a database.

# You may wonder about my use of $foo vs. ${foo} vs. "$foo" vs. "${foo}".
# It's basically random.  I'm expecting to come up with some rules for
# choosing between these any day now.
# As far as I can tell, you use {} in case of concatenation with a
# letter or digit, and you use "" to protect against the possibility
# of there being a space in the variable value.

set -e

# $0 -h <hostname> -u <username> -i <identityfile> -n <hostname>

# The host must always be specified
# OPENTREE_HOST=dev.opentreeoflife.org
OPENTREE_ADMIN=admin
OPENTREE_IDENTITY=opentree.pem
OPENTREE_NEO4J_HOST=dev.opentreeoflife.org
COMMAND=push

if [ x$CONTROLLER = x ]; then
    CONTROLLER=`whoami`
fi

# On ubuntu, the admin user is called 'ubuntu'

while [ $# -gt 0 ]; do
    if [ ${1:0:1} != - ]; then
	break
    elif [ "x$1" = "x-h" ]; then
	OPENTREE_HOST="$2"
    elif [ "x$1" = "x-u" ]; then
	OPENTREE_ADMIN="$2"
    elif [ "x$1" = "x-i" ]; then
	OPENTREE_IDENTITY="$2"
    elif [ "x$1" = "x-n" ]; then
	OPENTREE_NEO4J_HOST="$2"
    elif [ "x$1" = "x-c" ]; then
        source "$2"
    else
	echo 1>&2 "Unrecognized flag: $1"
	exit 1
    fi
    shift
    shift
done

if [ $# -gt 0 ]; then
    COMMAND="$1"
    shift
else
    COMMAND=push
fi

if [ "x$OPENTREE_HOST" = x ]; then echo "OPENTREE_HOST not specified"; exit 1; fi

# abbreviations... no good reason for these, they just make the commands shorter
ADMIN=$OPENTREE_ADMIN
PEM=$OPENTREE_IDENTITY
NEO4JHOST=$OPENTREE_NEO4J_HOST

SSH="ssh -i ${PEM}"

# For unprivileged actions
OT_USER=opentree

echo "host=$OPENTREE_HOST, admin=$ADMIN, pem=$PEM, controller=$CONTROLLER, command=$COMMAND"

# Eventually finer grained: e.g.
#   server A - browser, curator
#   server B - api, doc store, oti
#   server C - treemachine, taxomachine

function docommand {
    case $COMMAND in
        push)
	    sync_system
	    pushmost $*
	    finish
    	    ;;
	push-web2py)
            sync_system
	    pushweb2py $*
	    finish
	    ;;
	push-api)
            sync_system
	    pushapi $*
	    ;;
	push-db)
	    sync_system
	    pushdb $*
    	    ;;
	echo)
	    ${SSH} "$OT_USER@$OPENTREE_HOST" bash <<EOF
 	        echo $*
EOF
	    ;;
	*)
	    echo fall-through
	    ;;
    esac 
}

function sync_system {
    # Do privileged stuff
    rsync -pr -e "${SSH}" as-admin.sh "$ADMIN@$OPENTREE_HOST":
    # was scp -p -i "${PEM}" as-admin.sh "$ADMIN@$OPENTREE_HOST":
    ${SSH} "$ADMIN@$OPENTREE_HOST" ./as-admin.sh "$OPENTREE_HOST"
    # Copy files over
    rsync -pr -e "${SSH}" "--exclude=*~" "--exclude=#*" setup "$OT_USER@$OPENTREE_HOST":
    }

function pushmost {
    pushweb2py
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-neo4j-apps.sh $CONTROLLER
    finish
}

function finish {
    # The install scripts modify the apache config file, so do this last
    ${SSH} "$ADMIN@$OPENTREE_HOST" \
      sudo cp -p "~$OT_USER/setup/apache-config" /etc/apache2/sites-available/opentree
    echo "Restarting apache httpd..."
    ${SSH} "$ADMIN@$OPENTREE_HOST" sudo apache2ctl graceful
}

function pushweb2py {
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-web2py-apps.sh "$OPENTREE_HOST" "${NEO4JHOST}" $CONTROLLER
}

function pushapi {
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-api.sh "$OPENTREE_HOST" "${NEO4JHOST}" $CONTROLLER
}

function pushdb {
    # Work in progress - code not yet enabled
    # E.g. ./push.sh push-db localnewdb.db.tgz taxomachine
    TARBALL=$1
    APP=$2
    rsync -vax -e "${SSH}" $TARBALL "$OT_USER@$OPENTREE_HOST":downloads/$APP.db.tgz
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install_db.sh "$OPENTREE_HOST" $APP
}

docommand $*

# Test: 
# Ubuntu micro:
#  open http://ec2-54-202-160-175.us-west-2.compute.amazonaws.com/
# Debian small:
#  open http://ec2-54-202-237-199.us-west-2.compute.amazonaws.com/
