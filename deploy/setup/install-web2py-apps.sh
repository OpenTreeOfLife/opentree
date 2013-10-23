#!/bin/bash

set -e

echo "Installing web2py applications"
date

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads
mkdir -p repo

if [ ! -r .updated ]; then
    sudo apt-get --assume-yes update
    touch .updated
fi

if [ ! -x `which dialog` ]; then
    # I was hoping this would help with apache2's configure step, but it doesn't
    sudo apt-get --assume-yes install dialog
fi

# ---------- APACHE ----------
if [ ! -r /etc/init.d/apache2 ]; then
    echo Installing apache httpd
    # Prompts "do you want to continue?"
    sudo apt-get --assume-yes install apache2
    echo Done
fi

# Enable the apache proxy module
if [ ! -r /etc/apache2/mods-enabled/proxy.load ]; then
    sudo a2enmod proxy
fi

# ---------- UNZIP ----------
# unzip is needed for unpacking web2py.  Somebody broke the 'which' program -
# you can't just check the status code any more.
if [ `which unzip`x = x ]; then
    sudo apt-get --assume-yes install unzip
fi

# ---------- PIP ----------
# Get pip
if [ `which pip`x = x ]; then
    sudo apt-get --assume-yes install python-pip
fi

# ---------- GIT ----------
# Get git (so we can clone the opentree repo)
if [ `which git`x = x ]; then
    sudo apt-get --assume-yes install git
fi

# ---------- WSGI ----------
# Get wsgi (apache / web2py communication)
if [ ! -r /etc/apache2/mods-enabled/wsgi.load ]; then
    sudo apt-get --assume-yes install libapache2-mod-wsgi
fi

# AWS has python 2.7.3 built in, no need to install it.

# ---------- WEB2PY ----------
if [ ! -d web2py ]; then
    if [ ! -r downloads/web2py_src.zip ]; then
	wget --no-verbose -O downloads/web2py_src.zip \
	  http://www.web2py.com/examples/static/web2py_src.zip
    fi
    unzip downloads/web2py_src.zip
fi

# ---------- VIRTUALENV ----------
# Get virtualenv
if [ `which virtualenv`x = x ]; then
    sudo apt-get --assume-yes install python-virtualenv
fi

# Set up python env
if [ ! -d venv ]; then
    virtualenv venv
fi
source venv/bin/activate

# ---------- VIRTUALENV + WEB2PY + WSGI ----------

# http://stackoverflow.com/questions/11758147/web2py-in-apache-mod-wsgi-with-virtualenv
echo <<EOF >/tmp/fragment
activate_this = $PWD'/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))
import sys
sys.path.insert(0, $PWD'/web2py')
EOF

(head -2 web2py/handlers/wsgihandler.py; \
 cat /tmp/fragment; \
 tail -n +3 web2py/handlers/wsgihandler.py) \
   > web2py/wsgihandler.py

# ---------- THE WEB APPLICATIONS ----------
# Set up web2py apps as directed in the README.md file

opentree=repo/opentree

# Consider cloning a designated tag, using git clone --branch <tag>

# ssh cloning fails with "Permission denied (publickey)"
# git clone git@github.com:OpenTreeOfLife/opentree.git

# There ought to be a more efficient way of doing this, if the repo
# has already been cloned, but it's more complicated than I want to
# figure out right now.

if [ ! -d $opentree ] ; then
    (cd `dirname $opentree`; git clone https://github.com/OpenTreeOfLife/opentree.git)
else
    (cd $opentree; git checkout .; git pull origin master)
fi

# Modify the requirements list
# numpy etc. have all kinds of dependency problems.
cp $opentree/requirements.txt requirements.txt.save
if grep --invert-match "biopython\\|numpy\\|scipy\\|PIL\\|lxml" \
      $opentree/requirements.txt >requirements.txt.new ; then
    mv requirements.txt.new $opentree/requirements.txt
fi

# xslt
# svnversion ?
(cd $opentree; pip install -r requirements.txt)

cp -p $opentree/oauth20_account.py web2py/gluon/contrib/login_methods/
cp -p $opentree/SITE.routes.py web2py/routes.py

# File pushed here using rsync, see push.sh
cp -p setup/webapp-config $opentree/webapp/private/config 

# Similarly taxomachine

(cd web2py/applications; \
    ln -sf ../../repo/opentree/webapp ./opentree; \
    ln -sf ../../repo/opentree/curator ./)

# Set up apache

# Manual step performed earlier: copy apache config from cloud, then modify it...
# scp -i opentree.pem ubuntu@ec2-54-202-160-175.us-west-2.compute.amazonaws.com:/etc/apache2/sites-available/default setup/apache-config

sudo cp -p setup/apache-config /etc/apache2/sites-available/dev.opentreeoflife.org
(cd /etc/apache2/sites-enabled; sudo ln -sf ../sites-available/dev.opentreeoflife.org ./)
sudo rm -f /etc/apache2/sites-enabled/000-default

# How to get favico.ico served up?

echo Restarting apache2
sudo apache2ctl graceful

echo "source $HOME/setup/activate" >~/.bashrc
