The Open Tree Deployment Scheme
===============================

The Open Tree application consists of three main parts:

* The web2py container, with several 'applications' running under it, including 'opentree' and 'curator'
* A neo4j (graph database) DBMS, 'treemachine', with its own database and set of web services
* A second neo4j DBMS, 'taxomachine', with its own database and set of web services

These can run on one server, or on three servers, or anything in between; it doesn't really matter since all communication is done over HTTP.

Currently it's assumed that treemachine and taxomachine are running on the same server.

The web2py applications don't need much memory, so a 'micro' or 'small' server is probably fine.  For treemachine and taxomachine, you'll want a lot of RAM.  We've been using a 17G server for this purpose.

How to deploy a new server
--------------------------

Got to Amazon or some other cloud provider, and reserve an instance
running Debian GNU/Linux.  We've been using m1.small servers when
running without big neo4j instances, m2.xlarge for those running with.

Put the ssh private key somewhere, e.g. 'opentree.pem'.  
Set its file permissions to 600.

Create one configuration file for each server.  A configuration is just a shell script that sets some variables.

Run the setup script, which is called 'push.sh', as

     ./push.sh -c {configfile}

See sample.config in this directory for documentation on how to prepare a configuration file. 

The push.sh script starts by pushing out a script to be run as the admin user (setup/as_admin.sh).  This script installs prerequisite software and sets up an unprivileged 'opentree' user.  Then further scripts are run as user 'opentree'.  The only privileged operation thereafter is restarting Apache.

All manipulation of the server, other than ad hoc temporary patches and debugging, should be done through the push script.  If you find you need functionality that it doesn't provide please contact JAR.

The script may be re-run, and it tries to save time by avoiding reexecution of steps it has already performed based on sources that haven't changed.  If you're debugging you can re-run it repeatedly every time you want to try a change. (Unfortunately, at present it always reads from master branches of repos, but this is supposed to change soon.)

Setting up the API and studies repo
-----------------------------------

    ./push.sh -c {configfile} push-api

This requires OPENTREE_GH_IDENTITY to point to the file containing the ssh private for github access.

How to push the neo4j databases
-------------------------------

If the server is to run treemachine or taxomachine (optional; ordinarily this requires a 'big' server), the appropriate database has to be pushed out to the server and installed, as a separate step.  Create a compressed tar file of the neo4j database directory (which by default is called 'graph.db' although you can call it whatever you like locally).  Then copy it to the server using rsync.  Suppose the neo4j .db directory is data/newlocaldb.db. The you would say:

    tar -C data/newlocaldb.db -czf newlocaldb.db.tgz .
    {deploy}/push.sh push-db -c {configfile} newlocaldb.db {app}

where {app} is taxomachine, or treemachine, and {deploy} is the path to the directory containing push.sh.

New versions of the database can be pushed out in this way as desired, replacing the previous version each time.  The previous version is kept for disaster recovery, but if it needs to be reinstalled, that has to be done manually.

Indexing the store
------------------

The following causes oti to index all of the studies in the study store [which one?].  WORK IN PROGRESS, not yet functional as of 2013-12-20.

    ./push.sh -c {configfile} index-db

