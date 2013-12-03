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
# OPENTREE_HOST
# OPENTREE_ADMIN
# OPENTREE_IDENTITY
# OPENTREE_NEO4J_HOST

HOST=dev.opentreeoflife.org
ADMIN=admin
PEM=opentree.pem
NEO4JHOST=dev.opentreeoflife.org

# On ubuntu, the admin user is called 'ubuntu'

while [ $# -gt 0 ]; do
    if [ "x$1" = "x-h" ]; then
	OPENTREE_HOST="$2"
    elif [ "x$1" = "x-u" ]; then
	OPENTREE_ADMIN="$2"
    elif [ "x$1" = "x-i" ]; then
	OPENTREE_IDENTITY="$2"
    elif [ "x$1" = "x-n" ]; then
	OPENTREE_NEO4J_HOST="$2"
    elif [ "x$1" = "x-c" ]; then
        source "$2"
    elif [ "x${1:0:1}" = "x-" ]; then
	echo 1>&2 "Unrecognized flag: $1"
	exit 1
    else
	COMMAND="$1"
    fi
    shift
    shift
done

# abbreviations... no good reason for these, they just make the commands shorter
HOST=$OPENTREE_HOST
ADMIN=$OPENTREE_ADMIN
PEM=$OPENTREE_IDENTITY
NEO4JHOST=$OPENTREE_NEO4J_HOST

echo "Pushing to $HOST, admin=$ADMIN, pem=$PEM"

SSH="ssh -i ${PEM}"

# Do privileged stuff
scp -p -i "${PEM}" as-admin.sh "$ADMIN@$HOST":
${SSH} "$ADMIN@$HOST" ./as-admin.sh "${HOST}"

# Unprivileged actions
USER=opentree

rsync -pr -e "${SSH}" "--exclude=*~" setup "$USER@$HOST":

${SSH} "$USER@$HOST" ./setup/install-web2py-apps.sh "${HOST}" "${NEO4JHOST}"
${SSH} "$USER@$HOST" ./setup/install-neo4j-apps.sh "${HOST}"

# The install scripts modify the apache config file, so do this last
${SSH} "$ADMIN@$HOST" \
  sudo cp -p "~$USER/setup/apache-config" /etc/apache2/sites-available/opentree
echo "Restarting apache httpd..."
${SSH} "$ADMIN@$HOST" sudo apache2ctl graceful


# Work in progress - code not yet enabled
# E.g. push_neo4j_db localnewdb.db.tgz taxomachine

function push_neo4j_db {
    TGZ=$1
    APP=$2
    rsync -vax -e "${SSH}" $1 "$USER@$HOST":downloads/$APP.db.tgz
    ${SSH} ${PEM} setup/install_db.sh $APP "$HOST"
}


# Test: 
# Ubuntu micro:
#  open http://ec2-54-202-160-175.us-west-2.compute.amazonaws.com/
# Debian small:
#  open http://ec2-54-202-237-199.us-west-2.compute.amazonaws.com/
