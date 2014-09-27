#!/bin/bash

OPENTREE_USER=$1
OPENTREE_HOME=$(bash <<< "echo ~$OPENTREE_USER")
echo "OPENTREE_HOME is $OPENTREE_HOME"

if [ ! -r /etc/apache2/sites-available/opentree -o \
     ! cmp "$OPENTREE_HOME/setup/apache-config-vhost" /etc/apache2/sites-available/opentree ]; then
    sudo cp -p "$OPENTREE_HOME/setup/apache-config-vhost" /etc/apache2/sites-available/opentree
fi

if [ ! -r /etc/apache2/sites-available/opentree-ssl -o \
     ! cmp "$OPENTREE_HOME/setup/apache-config-vhost-ssl" /etc/apache2/sites-available/opentree-ssl ]; then
    sudo cp -p "$OPENTREE_HOME/setup/apache-config-vhost-ssl" /etc/apache2/sites-available/opentree-ssl
fi

TMP=/tmp/$$.tmp
sed -e s+/home/opentree+$OPENTREE_HOME+ <"$OPENTREE_HOME/setup/apache-config-shared" >$TMP
if [ ! -r /etc/apache2/opentree-config-shared -o \
     ! cmp $TMP /etc/apache2/opentree-config-shared ]; then
    sudo cp -p $TMP /etc/apache2/opentree-config-shared
fi
rm $TMP

echo "Restarting apache httpd..."
sudo apache2ctl graceful

