#!/bin/sh

if [ $# != 1 ]; then
    echo 1>&2 Usage: $0 hostname
    exit 1
fi

#HOST=ec2-54-202-160-175.us-west-2.compute.amazonaws.com
HOST=$1
USER=ubuntu

if [ ! -r ${HOST}.pem ]; then
    echo 1>&2 Please put private key in file ${HOST}.pem
    exit 1
fi

SSH="ssh -i ${HOST}.pem"
rsync -pr -e "${SSH}" "--exclude=*~" setup $USER@$HOST:
${SSH} $USER@$HOST ./setup/install-web2py-apps.sh ${HOST}
${SSH} $USER@$HOST ./setup/install-neo4j-apps.sh ${HOST}

# Test: 
#  open http://ec2-54-202-160-175.us-west-2.compute.amazonaws.com/
