#!/bin/bash

OPENTREE_USER=$1
OPENTREE_HOME=$(bash <<< "echo ~$OPENTREE_USER")

if [ ! -r /etc/apache2/sites-available/opentree ] || \
   ! cmp "$OPENTREE_HOME/setup/apache-config-vhost" /etc/apache2/sites-available/opentree; then
    echo "Installing opentree vhost config"
    sudo cp -p "$OPENTREE_HOME/setup/apache-config-vhost" /etc/apache2/sites-available/opentree || "Sudo failed"
fi

if [ ! -r /etc/apache2/sites-available/opentree-ssl ] || \
   ! cmp "$OPENTREE_HOME/setup/apache-config-vhost-ssl" /etc/apache2/sites-available/opentree-ssl; then
    echo "Installing opentree ssl vhost config"
    sudo cp -p "$OPENTREE_HOME/setup/apache-config-vhost-ssl" /etc/apache2/sites-available/opentree-ssl || "Sudo failed"
fi

TMP=/tmp/$$.tmp
sed -e s+/home/opentree+$OPENTREE_HOME+ <"$OPENTREE_HOME/setup/apache-config-shared" >$TMP
if [ ! -r /etc/apache2/opentree-config-shared ] || \
   ! cmp $TMP /etc/apache2/opentree-config-shared; then
    echo "Installing opentree vhosts shared config"
    sudo cp -p $TMP /etc/apache2/opentree-config-shared || "Sudo failed"
fi
rm $TMP

echo "Restarting apache httpd..."
sudo apache2ctl graceful || "Sudo failed"
