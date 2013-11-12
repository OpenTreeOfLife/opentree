#!/bin/sh

set -e

# $0 -h <hostname> -u <username> -i <identityfile>
# OPENTREE_HOST
# OPENTREE_ADMIN
# OPENTREE_IDENTITY

HOST=dev.opentreeoflife.org
ADMIN=admin
PEM=opentree.pem

# On ubuntu, the admin user is called 'ubuntu'

if [ "x$OPENTREE_HOST" != "x" ]; then
    HOST="$OPENTREE_HOST"; fi
if [ "x$OPENTREE_ADMIN" != "x" ]; then
    ADMIN="$OPENTREE_ADMIN"; fi
if [ "x$OPENTREE_IDENTITY" != "x" ]; then
    PEM=$OPENTREE_IDENTITY; fi

while [ $# -gt 0 ]; do
    if [ "x$1" = "x-h" ]; then
	HOST="$2"
    elif [ "x$1" = "x-u" ]; then
	ADMIN="$2"
    elif [ "x$1" = "x-i" ]; then
	PEM="$2"
    elif [ "x${1:0:1}" = "x-" ]; then
	echo 1>&2 "Unrecognized flag: $1"
	exit 1
    else
	COMMAND="$1"
    fi
    shift
    shift
done

if [ "x$HOST" = "x" ]; then
    echo 1>&2 Missing hostname
    echo 1>&2 "Usage: $0 [-h host] [-u user] [-i identity]"
    exit 1
fi
if [ "x$ADMIN" = "x" ]; then
    echo 1>&2 Missing admin username
    echo 1>&2 "Usage: $0 [-h host] [-u user] [-i identity]"
    exit 1
fi
if [ "x$PEM" = "x" ]; then
    echo 1>&2 Missing identity file name
    echo 1>&2 "Usage: $0 [-h host] [-u user] [-i identity]"
    exit 1
fi

if [ ! -r ${PEM} ]; then
    echo 1>&2 "Please supply with -i <key>, or put in file ${PEM}"
    exit 1
fi

SSH="ssh -i ${PEM}"

# Do privileged stuff
scp -p -i "${PEM}" as-admin.sh "$ADMIN@$HOST":
${SSH} "$ADMIN@$HOST" ./as-admin.sh "${HOST}"

# Unprivileged
USER=opentree

rsync -pr -e "${SSH}" "--exclude=*~" setup "$USER@$HOST":

# TBD: Dispatch based on what the command is.
${SSH} "$USER@$HOST" ./setup/install-web2py-apps.sh "${HOST}"
${SSH} "$USER@$HOST" ./setup/install-neo4j-apps.sh "${HOST}"

${SSH} "$ADMIN@$HOST" \
  sudo cp -p "~$USER/setup/apache-config" /etc/apache2/sites-available/opentree

${SSH} "$ADMIN@$HOST" sudo apache2ctl graceful


# Test: 
# Ubuntu micro:
#  open http://ec2-54-202-160-175.us-west-2.compute.amazonaws.com/
# Debian small:
#  open http://ec2-54-202-237-199.us-west-2.compute.amazonaws.com/
