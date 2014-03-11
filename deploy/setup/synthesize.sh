#!/bin/bash

# Do ./push.sh -c otX.config echo x
#  to synchronize the 'setup' directory.
# Then log in to otX and run this script: bash setup/synthesize.sh


. setup/functions.sh

CONTROLLER=$1
if [ x$CONTROLLER = x ]; then CONTROLLER=anonymous; fi

mkdir -p repo

JAR=target/treemachine-0.0.1-SNAPSHOT-jar-with-dependencies.jar

if git_refresh OpenTreeOfLife treemachine || [ ! -r repo/treemachine/$JAR ]; then
    (cd repo/treemachine; sh mvn_cmdline.sh)
fi

git_refresh OpenTreeOfLife gcmdr

pushd repo/gcmdr
ln -sf ../treemachine/$JAR ./
python run_asterales_example.py
popd
