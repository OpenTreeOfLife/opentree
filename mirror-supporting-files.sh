#!/bin/sh

# This script can be run periodically (cronjob, etc) to capture a remote copy
# of the supporting files folder in any instance(s) of the Open Tree of Life curation app.
# rsync from any hostname found in the subfolders of ot-supporting-files-mirror/

# sensible defaults for hostname, path to local mirror, etc.
[ "x$CURATION_HOST" != x ] || CURATION_HOST=devtree.opentreeoflife.org

# NOTE that you'll need to define $CURATION_HOST in local ~/.ssh/config to connect via SSH, e.g.
#   host  ot11  devtree.opentreeoflife.org
#       Hostname ot11.opentreeoflife.org
#       Port 22
#       ...

# Create a local mirror folder with this hostname, if not found.
[ "x$LOCAL_MIRROR" != x ] || LOCAL_MIRROR=../supporting-files-mirror/$CURATION_HOST

if ! test -d $LOCAL_MIRROR
then
    mkdir -p $LOCAL_MIRROR || exit
fi

# Save one previous version (incl. deleted files) in a second folder.
# N.B. this is *relative* to $LOCAL_MIRROR above!
[ "x$LOCAL_BACKUPDIR" != x ] || LOCAL_BACKUPDIR=../$CURATION_HOST-older

rsync --progress --compress --archive --backup --backup-dir=$LOCAL_BACKUPDIR --delete $CURATION_HOST:/home/opentree/repo/opentree/curator/uploads $LOCAL_MIRROR

