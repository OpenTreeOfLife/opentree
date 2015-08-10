#!/bin/bash

# push.sh -c {configfile} {command} {arg...}  - see README.md for documentation
# The command is either a component to install, or an operation to
# perform.  Components are opentree [web app], api, taxomachine, etc.
# Operation to perform would be copying a neo4j database image or
# invoking the OTI indexing operation.

# If command is missing, components are pushed to the server according
# to OPENTREE_COMPONENTS as defined in the config file.

# You may wonder about my use of $foo vs. ${foo} vs. "$foo" vs. "${foo}".
# It's basically random.  I'm expecting to come up with some rules for
# choosing between these any day now.
# As far as I can tell, you use {} in case of concatenation with a
# letter or digit, and you use "" to protect against the possibility
# of there being a space in the variable value.

function err {
    echo "Error: $@" 1>&2
    exit 1
}

set -e

# $0 -h <hostname> -u <username> -i <identityfile> -n <hostname>

function opentree_branch {
    # Ignore on this end, in case the currently executing bash doesn't
    # have associative arrays.  See functions.sh for the 'real' definition.
    true
}

# declare -A OPENTREE_BRANCHES  - doesn't work in bash 3.2.48
#  but associative arrays seem to work without the declaration in
#  3.2.48 and in 4.2.37, contrary to documentation on web

# The host must always be specified
# OPENTREE_HOST=dev.opentreeoflife.org
# OPENTREE_NEO4J_HOST=dev.opentreeoflife.org

# The following defaults; they can be overridden by the config file
OPENTREE_ADMIN=admin
OPENTREE_IDENTITY=opentree.pem
OPENTREE_DOCSTORE=phylesystem
COLLECTIONS_REPO=collections
FAVORITES_REPO=favorites-1
OPENTREE_GH_IDENTITY=opentree-gh.pem
OPENTREE_COMPONENTS=most
OPENTREE_USER=opentree
DRYRUN=no
FORCE_COMPILE=no

if [ x$CONTROLLER = x ]; then
    CONTROLLER=`whoami`
fi

# On ubuntu, the admin user is called 'ubuntu'

while [ $# -gt 0 ]; do
    if [ ${1:0:1} != - ]; then
        break
    fi
    flag=$1
    shift
    if [ "x$flag" = "x-c" ]; then
        # Config file overrides default parameter settings
        configfile=$1
        source "$configfile"; shift
        cp -pf $configfile setup/CONFIG    # Will get copied during 'sync'
    elif [ "x$flag" = "x-f" ]; then
        #echo "Forcing recompile!"
        FORCE_COMPILE=yes;
    elif [ "$flag" = "--dry-run" ]; then
        #echo "Dry run only!"
        DRYRUN=yes;
    # The following are all legacy; do not add cases to this 'while'.
    # Configuration should now be done in the config file.
    elif [ "x$flag" = "x-h" ]; then
        OPENTREE_HOST="$1"; shift
    elif [ "x$flag" = "x-p" ]; then
        OPENTREE_PUBLIC_DOMAIN="$1"; shift
    elif [ "x$flag" = "x-u" ]; then
        OPENTREE_ADMIN="$1"; shift
    elif [ "x$flag" = "x-i" ]; then
        OPENTREE_IDENTITY="$1"; shift
    elif [ "x$flag" = "x-n" ]; then
        OPENTREE_NEO4J_HOST="$1"; shift
    else
        err "Unrecognized flag: $flag"
    fi
done

if [ "x$OPENTREE_HOST" = x ] ; then err "OPENTREE_HOST not specified"; fi
if [ "x$OPENTREE_IDENTITY" = x ]; then err "OPENTREE_IDENTITY not specified"; fi
if [ ! -r $OPENTREE_IDENTITY ]; then err "$OPENTREE_IDENTITY not found"; fi
[ "x$OPENTREE_NEO4J_HOST" != x ] || OPENTREE_NEO4J_HOST=$OPENTREE_HOST
[ "x$OPENTREE_PUBLIC_DOMAIN" != x ] || OPENTREE_PUBLIC_DOMAIN=$OPENTREE_HOST

[ "x$CURATION_GITHUB_CLIENT_ID" != x ] || CURATION_GITHUB_CLIENT_ID=ID_NOT_PROVIDED
[ "x$CURATION_GITHUB_REDIRECT_URI" != x ] || CURATION_GITHUB_REDIRECT_URI=$OPENTREE_PUBLIC_DOMAIN/webapp
[ "x$TREEVIEW_GITHUB_CLIENT_ID" != x ] || TREEVIEW_GITHUB_CLIENT_ID=ID_NOT_PROVIDED
[ "x$TREEVIEW_GITHUB_REDIRECT_URI" != x ] || TREEVIEW_GITHUB_REDIRECT_URI=$OPENTREE_PUBLIC_DOMAIN/curator

[ "x$TREEMACHINE_BASE_URL" != x ] || TREEMACHINE_BASE_URL=$OPENTREE_NEO4J_HOST/treemachine
[ "x$TAXOMACHINE_BASE_URL" != x ] || TAXOMACHINE_BASE_URL=$OPENTREE_NEO4J_HOST/taxomachine
# Extraneous http:// is needed for now, but should get phased out
[ "x$OTI_BASE_URL" != x ] || OTI_BASE_URL=http://$OPENTREE_NEO4J_HOST/oti
[ "x$OPENTREE_API_BASE_URL" != x ] || OPENTREE_API_BASE_URL=$OPENTREE_PUBLIC_DOMAIN/api/v1
[ "x$COLLECTIONS_API_BASE_URL" != x ] || COLLECTIONS_API_BASE_URL=$OPENTREE_PUBLIC_DOMAIN/v2
[ "x$FAVORITES_API_BASE_URL" != x ] || FAVORITES_API_BASE_URL=$OPENTREE_PUBLIC_DOMAIN/v2

[ "x$OPENTREE_DEFAULT_APPLICATION" != x ] || OPENTREE_DEFAULT_APPLICATION=opentree

# abbreviations... no good reason for these, they just make the commands shorter

ADMIN=$OPENTREE_ADMIN

SSH="ssh -i ${OPENTREE_IDENTITY}"

# For unprivileged actions
OT_USER=$OPENTREE_USER

echo "host=$OPENTREE_HOST, admin=$ADMIN, pem=$OPENTREE_IDENTITY, controller=$CONTROLLER, command=$1"

restart_apache=no

function docommand {

    if [ $# -eq 0 ]; then
        if [ $DRYRUN = yes ]; then echo "[no command]"; fi
        for component in $OPENTREE_COMPONENTS; do
            docomponent $component
        done
        return
    fi

    command="$1"
    shift
    case $command in
    # Commands
    push-db | pushdb)
        push_db $*
            ;;
    install-db)
        install_db $*
        ;;
    index  | indexoti | index-db)
        index
            ;;
    files)
        install_files
        ;;
    apache)
        restart_apache=yes
            ;;
    echo)
        # Test ability to do remote commands inline...
        ${SSH} "$OT_USER@$OPENTREE_HOST" bash <<EOF
             echo $*
EOF
        ;;
    none)
        echo "No components specified.  Try configuring OPENTREE_COMPONENTS"
        ;;

    *)
        if ! in_list $command $OPENTREE_COMPONENTS; then
	    err "Unrecognized command, or component not in OPENTREE_COMPONENTS: $command";
	fi
        docomponent $command
    esac
}

# Push a single component

function docomponent {
    component=$1
    # 'api' option is for backward compatibility
    if [ $component = api ]; then component=phylesystem-api; fi
    case $component in
    opentree)
        push_opentree
        restart_apache=yes
        ;;
    phylesystem-api)
        push_phylesystem_api
        restart_apache=yes
        ;;
    oti)
        push_neo4j oti
        ;;
    treemachine)
        push_neo4j treemachine
        # restart apache to clear the RAM cache (stale results)
        restart_apache=yes
        ;;
    taxomachine)
        push_neo4j taxomachine
        # restart apache to clear the RAM cache (stale results)
        restart_apache=yes
        ;;

    *)
        echo "Unrecognized component: $command"
        ;;
    esac 
}

# list="w x y"; in_list x $list; echo $?
# kjetil v halvorsen via stackoverflow
function in_list() {
       local search="$1"
       shift
       local list=("$@")
       for file in "${list[@]}" ; do
           [[ "$file" == "$search" ]] && return 0
       done
       return 1
    }

function sync_system {
    echo "Syncing"
    if [ $DRYRUN = "yes" ]; then echo "[sync]"; return; fi
    # Do privileged stuff
    # Don't use rsync - might not be installed yet
    scp -p -i "${OPENTREE_IDENTITY}" as-admin.sh "$ADMIN@$OPENTREE_HOST":
    ${SSH} "$ADMIN@$OPENTREE_HOST" ./as-admin.sh "$OPENTREE_HOST" "$OPENTREE_USER"
    # Copy files over
    rsync -pr -e "${SSH}" "--exclude=*~" "--exclude=#*" setup "$OT_USER@$OPENTREE_HOST":
    }

function push_neo4j {
    if [ $DRYRUN = "yes" ]; then echo "[neo4j app: $1]"; return; fi
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-neo4j-app.sh $CONTROLLER $1 $FORCE_COMPILE
}

# The install scripts modify the apache config files, so do this last
function restart_apache {
    if [ $DRYRUN = "yes" ]; then echo "[restarting apache]"; return; fi
    scp -p -i "${OPENTREE_IDENTITY}" restart-apache.sh "$ADMIN@$OPENTREE_HOST":
    ${SSH} "$ADMIN@$OPENTREE_HOST" bash restart-apache.sh "$OT_USER" "$OPENTREE_HOST"
}

function push_opentree {

    if [ $CURATION_GITHUB_CLIENT_ID = ID_NOT_PROVIDED ]; then echo "WARNING: Missing GitHub client ID! Curation UI will be disabled."; fi
    if [ $TREEVIEW_GITHUB_CLIENT_ID = ID_NOT_PROVIDED ]; then echo "WARNING: Missing GitHub client ID! Tree-view feedback will be disabled."; fi

    if [ $DRYRUN = "yes" ]; then echo "[opentree]"; return; fi
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-web2py-apps.sh "$OPENTREE_HOST" "${OPENTREE_PUBLIC_DOMAIN}" "${OPENTREE_DEFAULT_APPLICATION}" "$CONTROLLER" "${CURATION_GITHUB_CLIENT_ID}" "${CURATION_GITHUB_REDIRECT_URI}" "${TREEVIEW_GITHUB_CLIENT_ID}" "${TREEVIEW_GITHUB_REDIRECT_URI}" "${TREEMACHINE_BASE_URL}" "${TAXOMACHINE_BASE_URL}" "${OTI_BASE_URL}" "${OPENTREE_API_BASE_URL}" "${COLLECTIONS_API_BASE_URL}" "${FAVORITES_API_BASE_URL}"
    # place the files with secret GitHub API keys for curator and webapp (tree browser feedback) apps
    # N.B. This includes the final domain name, since we'll need different keys for dev.opentreeoflife.org, www.opentreeoflife.org, etc.
    keyfile=~/.ssh/opentree/treeview-GITHUB_CLIENT_SECRET-$OPENTREE_PUBLIC_DOMAIN
    if [ -r $keyfile ]; then
        rsync -pr -e "${SSH}" $keyfile "$OT_USER@$OPENTREE_HOST":repo/opentree/webapp/private/GITHUB_CLIENT_SECRET
    else
        echo "Cannot find GITHUB_CLIENT_SECRET file $keyfile"
    fi
    keyfile=~/.ssh/opentree/curation-GITHUB_CLIENT_SECRET-$OPENTREE_PUBLIC_DOMAIN
    if [ -r $keyfile ]; then
        rsync -pr -e "${SSH}" $keyfile "$OT_USER@$OPENTREE_HOST":repo/opentree/curator/private/GITHUB_CLIENT_SECRET
    else
        echo "Cannot find GITHUB_CLIENT_SECRET file $keyfile"
    fi

    # we’re using the bot for “anonymous” comments in the synth-tree explorer
    push_bot_identity
}

# See "getting a github oauth token" in the phylesystem-api documentation.

function push_bot_identity {
    # place an OAuth token for GitHub API by bot user 'opentreeapi'
    tokenfile=~/.ssh/opentree/OPENTREEAPI_OAUTH_TOKEN
    if [ -r $tokenfile ]; then
        rsync -pr -e "${SSH}" $tokenfile "$OT_USER@$OPENTREE_HOST":.ssh/OPENTREEAPI_OAUTH_TOKEN
        ${SSH} "$OT_USER@$OPENTREE_HOST" chmod 600 .ssh/OPENTREEAPI_OAUTH_TOKEN
    else
        echo "Cannot find OPENTREEAPI_OAUTH_TOKEN file $tokenfile"
    fi
}

function push_phylesystem_api {
    if [ $DRYRUN = "yes" ]; then echo "[api]"; return; fi

    push_bot_identity

    # Place private key for GitHub access 
    if [ "x$OPENTREE_GH_IDENTITY" = "x" ]; then
        echo "Warning: OPENTREE_GH_IDENTITY not specified"
    elif [ ! -r $OPENTREE_GH_IDENTITY ]; then
        echo "Warning: $OPENTREE_GH_IDENTITY not found"
    else
        rsync -p -e "${SSH}" "$OPENTREE_GH_IDENTITY" "$OT_USER@$OPENTREE_HOST":.ssh/opentree
        ${SSH} "$OT_USER@$OPENTREE_HOST" chmod 600 .ssh/opentree
    fi

    # Try to place an OAuth token for GitHub API by bot user 'opentreeapi'
    tokenfile=~/.ssh/opentree/OPENTREEAPI_OAUTH_TOKEN
    if [ -r $tokenfile ]; then
        rsync -p -e "${SSH}" $tokenfile "$OT_USER@$OPENTREE_HOST":.ssh/OPENTREEAPI_OAUTH_TOKEN
        ${SSH} "$OT_USER@$OPENTREE_HOST" chmod 600 .ssh/OPENTREEAPI_OAUTH_TOKEN
    else
        echo "****************************\n  OAuth token file (${tokenfile}) not found!\n  Falling back to any existing token on the server, OR a prompt for manual creation of webhooks.\n****************************"
    fi

    echo "Doc store is $OPENTREE_DOCSTORE"
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-api.sh "$OPENTREE_HOST" \
           $OPENTREE_DOCSTORE $COLLECTIONS_REPO $FAVORITES_REPO $CONTROLLER $OTI_BASE_URL $OPENTREE_API_BASE_URL $COLLECTIONS_API_BASE_URL $FAVORITES_API_BASE_URL $OPENTREE_DEFAULT_APPLICATION
}

function index {
    if [ $DRYRUN = "yes" ]; then echo "[index]"; return; fi
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/index-doc-store.sh $OPENTREE_API_BASE_URL $CONTROLLER
}

function push_db {
    if [ $DRYRUN = "yes" ]; then echo "[push_db]"; return; fi
        # E.g. ./push.sh push-db localnewdb.db.tgz taxomachine
        TARBALL=$1
        APP=$2
    if [ x$APP = x -o x$TARBALL = x ]; then
        err "Usage: $0 -c {configfile} push-db {tarball} {application}"
    fi
    HEREBALL=downloads/$APP.db.tgz
    time rsync -vax -e "${SSH}" $TARBALL "$OT_USER@$OPENTREE_HOST":$HEREBALL
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-db.sh $HEREBALL $APP $CONTROLLER
}

function install_db {
    HEREBALL=$1
    APP=$2
    ${SSH} "$OT_USER@$OPENTREE_HOST" ./setup/install-db.sh $HEREBALL $APP $CONTROLLER
}

# Copy smallish files over from opentree repo into the webroot for the
# files.opentreeoflife.org vhost

function install_files {
    if [ x$FILES_HOST = x ]; then 
        echo "FILES_HOST not defined"
    else
        # Transfer content
        rsync -prv -e "${SSH}" "--exclude=*~" "--exclude=#*" \
	      --backup --backup-dir=files.opentreeoflife.org.backup \
	      files.opentreeoflife.org "$OT_USER@$FILES_HOST":
    fi
}

sync_system
docommand $*
if [ $restart_apache = "yes" ]; then
    restart_apache
fi

# Test: 
# Ubuntu micro:
#  open http://ec2-54-202-160-175.us-west-2.compute.amazonaws.com/
# Debian small:
#  open http://ec2-54-202-237-199.us-west-2.compute.amazonaws.com/
