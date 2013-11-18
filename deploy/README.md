
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

Got to Amazon or some other cloud provider, and reserve an instance running Debian GNU/Linux.

Put the ssh private key somewhere, e.g. 'opentree.pem'.  Don't forget
to set file permissions to 600.

Run the setup script, which is called 'push.sh'.  This takes a few parameters, which can be set (currently) using either shell variables or using command line arguments.  TO BE DONE: This is sort of a crufty design.  It would probably be better if the parameters resided in a little parameter block file.

* -i <identityfile>  ... ssh private key, defaults to opentree.pem
* -h <hostname>  ... the hostname of the cloud host you'll be updating, and which will run web2py
* -u <adminuser>  ... the name of the admin user, defaults to 'admin' which is correct for Debian
* -n <neo4jhost>  ... the hostname of the server that's running treemachine and taxomachine, if different from the web2py server (which it will be, if the web2py server is small).  This must be set properly or you won't be able to see the synthetic tree.

Look at push.sh to see how to set these parameters using shell variables.

The push.sh script starts by pushing out a script to be run as the admin user (setup/as_admin.sh).  This script installs prerequisite software and sets up an unprivileged 'opentree' user.  Then further scripts are run as user 'opentree'.

How to push the neo4j databases
-------------------------------

If the server is big and is to run treemachine or taxomachine, the appropriate database has to be pushed out to the server and installed, as a separate step.  Create a compressed tar file of the neo4j database directory (which by default is called 'graph.db' although you can call it whatever youlike).  Then copy it to the server using rsync:

    rsync -e "ssh -i opentree.pem" -vax newlocaldb.db.tgz  \
        opentree@$host:downloads/treemachine.db.tgz

If you put the tarball in the target location as specified above, then the 'install_db.sh' installation script can pick it up.  Run the installation script as follows:

    ssh -i opentree.pem opentree@$host setup/install_db.sh treemachine

where $host is the same as <hostname> as specified above.

Repeat substituting 'taxomachine' for 'treemachine' if desired.

New versions of the database can be pushed out in this way as desired, replacing the previous version each time.  The previous version is kept for disaster recovery, but if it needs to be reinstalled, that has to be done manually.