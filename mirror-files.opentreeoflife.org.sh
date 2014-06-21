#!/bin/sh

# This script can be run periodically (cronjob, etc) to capture a remote copy
# of all files in the current files.opentreeoflife.org 
# The smaller files in this domain are in GitHub, so our main interest here is
# to keep safe copies of the larger files.

# sensible defaults for hostname, path to local mirror, etc.
[ "x$FILES_HOST" != x ] || FILES_HOST=ot10

# NOTE that you'll need to define $FILES_HOST in local ~/.ssh/config to connect via SSH, e.g.
#   host   ot10
#       Hostname ot10.opentreeoflife.org
#       Port 22
#       ...

# Create a local mirror folder with this hostname, if not found.
[ "x$LOCAL_MIRROR" != x ] || LOCAL_MIRROR=../files-domain-mirror/$FILES_HOST

if ! test -d $LOCAL_MIRROR
then
    mkdir -p $LOCAL_MIRROR || exit
fi

# Save one previous version (incl. deleted files) in a second folder.
# N.B. this is *relative* to $LOCAL_MIRROR above!
## [ "x$LOCAL_BACKUPDIR" != x ] || LOCAL_BACKUPDIR=../$FILES_HOST-older
# TODO: To save the previous version of any changed or deleted files, testore the --backup and --backup-dir options here:
## rsync --progress --compress --archive --backup --backup-dir=$LOCAL_BACKUPDIR --delete $FILES_HOST:files.opentreeoflife.org $LOCAL_MIRROR
rsync --progress --compress --archive --delete $FILES_HOST:files.opentreeoflife.org $LOCAL_MIRROR

