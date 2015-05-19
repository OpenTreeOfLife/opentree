#!/bin/bash

# Enable retrieval of java 8 from Debian unstable.
# Copy this script manually to EC2 admin home, and run as admin user.
# Do this *after* upgrading from wheezy to jessie.

# See http://jaqque.sbih.org/kplug/apt-pinning.html
# If no /etc/apt/preferences, create one
if [ ! -e /etc/apt/preferences ]; then
    cat >/tmp/apt-preferences <<EOF
Package: *
Pin: release n=jessie
Pin-Priority: 700
EOF
    sudo cp /tmp/apt-preferences /etc/apt/preferences
fi

# If unstable not yet allowed, at it as a source
if ! egrep -q unstable /etc/apt/preferences; then
    cp /etc/apt/preferences /tmp/apt-preferences
    cat >>/tmp/apt-preferences <<EOF
Package: *
Pin: release a=unstable
Pin-Priority: 10
EOF
    sudo cp /tmp/apt-preferences /etc/apt/preferences
else
    echo "- unstable is already in /etc/apt/preferences"
fi

echo "*** /etc/apt/preferences ***"
cat /etc/apt/preferences
echo

# Add unstable to sources.list

if ! egrep unstable /etc/apt/sources.list; then
    cp /etc/apt/sources.list /tmp/apt-sources-list
    cat >>/tmp/apt-sources-list <<EOF
#Unstable
deb http://cloudfront.debian.net/debian unstable main
deb-src http://cloudfront.debian.net/debian unstable main
EOF
    sudo cp -p /etc/apt/sources.list /etc/apt/sources.list~
    sudo cp /tmp/apt-sources-list /etc/apt/sources.list
else
    echo "- unstable is already in /etc/apt/sources.list"
fi

echo "*** /etc/apt/sources.list ***"
cat /etc/apt/sources.list
echo

# Update packages list
sudo apt-get update

