#!/bin/bash

# This script runs as the admin user, which has sudo privileges

OPENTREE_USER=$1
OPENTREE_HOST=$2
OPENTREE_HOME=$(bash <<< "echo ~$OPENTREE_USER")

if apt-cache policy apache2 | egrep -q "Installed: 2.2"; then

echo "This project requires apache 2.4 or higher! Please upgrade apache and try again."
exit 1

else

# Modern code, apache 2.4+

if [ ! -r /etc/apache2/sites-available/opentree.conf ] || \
   ! cmp -s "$OPENTREE_HOME/setup/opentree.conf" /etc/apache2/sites-available/opentree; then
    echo "Installing opentree vhost config"
    sudo cp -p "$OPENTREE_HOME/setup/opentree.conf" /etc/apache2/sites-available/ || "Sudo failed"
fi

if [ ! -r /etc/apache2/sites-available/opentree-ssl ] || \
   ! cmp -s "$OPENTREE_HOME/setup/opentree-ssl.conf" /etc/apache2/sites-available/opentree-ssl.conf; then
    echo "Installing opentree ssl vhost config"
    sudo cp -p "$OPENTREE_HOME/setup/opentree-ssl.conf" /etc/apache2/sites-available/ || "Sudo failed"
    sudo sed -i -e s/SERVERNAME_REPLACEME/$OPENTREE_HOST/ \
      /etc/apache2/sites-available/opentree-ssl.conf  || "Sudo failed"
fi

TMP=/tmp/$$.tmp
sed -e s+/home/opentree+$OPENTREE_HOME+ <"$OPENTREE_HOME/setup/opentree-shared.conf" >$TMP
if [ ! -r /etc/apache2/opentree-shared.conf ] || \
   ! cmp -s $TMP /etc/apache2/opentree-shared.conf; then
    echo "Installing opentree vhosts shared config"
    sudo cp -p $TMP /etc/apache2/opentree-shared.conf || "Sudo failed"
fi
rm $TMP
fi

echo "Restarting apache httpd..."
sudo apache2ctl graceful || "Sudo failed"
