The Open Tree Deployment Scheme
===============================

The Open Tree application currently consists of the following main components:

* The front end applications, 'opentree' and 'curator', which run in a web2py container
* The API application, running in the same web2py container or a different one
* The study index (OTI), which is a neo4j application
* 'Taxomachine, a neo4j application, with its own database and set of web services
* 'Treemachine, a neo4j application, with its own database and set of web services

These can run on one server, or on five servers, or anything in between; it doesn't really matter since all communication is done over HTTP.  For performance reasons (and because there's no reason not to) it's probably best if the API and OTI run on the same machine.

Currently it's assumed that treemachine and taxomachine are running on the same server.

The web2py applications don't need much memory, so an EC2 'micro' or 'small' server is probably fine.  For treemachine and taxomachine, you'll want a lot of RAM.  We've been using a 17G server for this purpose but are currently experiementing to see if 8G is enough. 

For more information about our current deployment practices, see the notes and configuration files in the [OpenTreeOfLife/deployed-systems](http://github.com/OpenTreeOfLife/deployed-systems) repo.

How to deploy a new server
--------------------------

**Note: We're now using a single, common approach to managing sensitive files (private keys and API "secrets").** 
These files should be kept in directory ```~/.ssh/opentree/```, so that configuration can be shared easily among your team. See the [deployed-systems README](https://github.com/OpenTreeOfLife/deployed-servers/blob/master/README.md) for details.

Go to Amazon or some other cloud provider, and reserve one or more instances
running Debian GNU/Linux (version 7.5 has been working for us, but others ought to as well).  As of 2014-07-08 we're using m3.medium servers that don't
run big neo4j databases (e.g. browser/curator only), 
m3.large for those that do (taxomachine/treemachine).

Put the ssh private key somewhere, e.g. in ~/.ssh/opentree/opentree.pem (on your own machine, 
not the server).
Set its file permissions to 600.

If running the API, put the private key for the github account somewhere (e.g. in ~/.ssh/opentree/), so that the API can push changes to study files out to github.

To support secure (HTTPS) web connections, put the private keyfile on the server. Our Apache config currently expects to find this at /etc/ssl/private/opentreeoflife.org.key

Create one configuration file for each server.  A configuration is just a shell script that sets some variables.  See sample.config in this directory for documentation on how to prepare a configuration file.

Run the setup script, which is called 'push.sh', as

     ./push.sh -c {configfile}

All manipulation of the server, other than ad hoc temporary patches and debugging, should be done through the push script.  If you find you need functionality that it doesn't provide, please create a github issue.

The push.sh script starts by pushing out a script to be run as the admin user (setup/as_admin.sh).  This script installs prerequisite software and creates an unprivileged 'opentree' user.  Then further scripts run as user 'opentree'.  The only privileged operation thereafter is restarting Apache.

After this, on each invocation of push.sh, the contents of the setup/
directory are synchronized from setup/ in the current directory - not from github. All other software is fetched from specified branches on github.

The script may be re-run, and it tries to save time by avoiding reexecution of steps it has already performed based on sources that haven't changed.  If you're debugging you can re-run it repeatedly every time you want to try a change. (Unfortunately, at present it always reads from master branches of repos, but this is supposed to change soon.)

Updating and debugging
----------------------

The contents of the setup/ directory are pushed out to the server every time push.sh runs.  This makes debugging deployment scripts easy, since that directory doesn't need to be pushed out to github first.  Application files from the various repositories are refreshed as needed from github.

You can deploy individual components by giving them as an argument to
the 'push.sh' command.  For example:

    ./push.sh -c {configfile} treemachine

stops treemachine's neo4j instance, updates its treemachine plugin, and restarts the instance.

For a list of components, see [sample.config](sample.config).

Setting up the API and studies repo
-----------------------------------

    ./push.sh -c {configfile} push-api

This requires OPENTREE_GH_IDENTITY, as set in the configuration file, to point to the file containing the ssh private key for github access.

How to push the neo4j databases
-------------------------------

If the server is to run treemachine or taxomachine (optional; ordinarily this requires a 'big' server), the appropriate database has to be pushed out to the server and installed, as a separate step.  Create a compressed tar file of the neo4j database directory (which by default is called 'graph.db' although you can call it whatever you like locally).  Then copy it to the server using push.sh.  Suppose the neo4j .db directory is data/newlocaldb.db. The you would say:

    tar -C {txxxmachine}/data/newlocaldb.db -czf newlocaldb.db.tgz .
    ./push.sh -c {configfile} pushdb newlocaldb.db.tgz {app}

where {txxxmachine} is the neo4j directory for the application and {app} is taxomachine or treemachine.

New versions of the database can be pushed out in this way as desired, replacing the previous version each time.  The previous version is kept for disaster recovery, but if it needs to be reinstalled, that has to be done manually.

Installing a new database version
---------------------------------

WORK IN PROGRESS

As an optimization, instead of doing pushdb as above you can copy a
.db.tgz file from another server (AWS), something like this:

    ssh -i ~/.ssh/opentree/opentree.pem opentree@ot83.opentreeoflife.org
    scp ot74.opentreeoflife.org:downloads/treemachine.db.tgz downloads/
    exit
    ./push.sh -c {configfile} install-db downloads/treemachine.db.tgz treemachine

(ssh / command / exit could be done with ssh with command on command line.)

Before you can do the scp it will be necessary for the machine running
scp to have a .ssh/id_rsa, and the one delivering the bits to have a
.ssh/authorized_keys that contains the corresponding public key.
Run ssh_keygen if necessary to create keys.

Following this, do 

Initializing the OTI database
-----------------------------

WORK IN PROGRESS

OTI's neo4j database needs to be initialized as a copy of the
taxomachine database.  Set up taxomachine and copy over its database, then:

    ./push.sh -c {configfile} install-db downloads/taxomachine.db.tgz oti

Indexing all the studies (OTI database)
---------------------------------------

The following causes the oti application to index all of the studies in the study store.

    ./push.sh -c {configfile} index-db

Restarting apache
-----------------

If all you've done is to update the apache configuration, just do

    ./push.sh -c {configfile} apache

to restart apache.

Updating the files.opentreeoflife.org web site
----------------------------------------------

    ./push.sh -c {configfile} files

This copies the contents of the files.opentreeoflife.org
directory out to the web root for the files.opentreeoflife.org vhost.
The location is determined by the value of FILES_HOST, which can be
set in the configuration file if desired.

This operation leaves in place any files that are already there.  The
large files (such as the synthetic tree) are not in github and are
at present (2014-07-08) managed manually.

Notifying users of scheduled downtime
-------------------------------------

For system migrations or other extended periods of downtime, we should take
special care to avoid lost work, particularly in the study curation app. We
currently have two means of notifying users before and during scheduled
maintenance windows.

While any Open Tree websites(s) are unavailable, their respective webservers
should redirect all traffic to the editable 
[maintenance page](http://opentreeoflife.github.io/maintenance.html) in our
github-pages sites. This should be done with a **302 Temporary** redirect.
Be sure to edit the text of this page to reflect the current situation and
expected downtime.

To avoid lost work in the [study curation app](http://tree.opentreeoflife.org/curator), 
we should also disable the creation and editing of studies in the hours before any 
scheduled downtime. This can be done by modifying the `[maintenance]` section of the 
curation app's `private/config` file:

```config
[maintenance]
# During system migration and other scheduled maintenance, we should allow
# viewing of existing studies but block study creation and editing.
# Boolean values here should be 'true' or 'false'. Use indents to define a long (multi-line) notice.
maintenance_in_progress = true
maintenance_notice = Study creation and editing are disabled while we upgrade to
                   the latest code and features. Please pardon the
                   inconvenience. We expect to be back online for editing
                   studies later this evening (Thursday, July 10).
```
An hour or two before disabling the server, set the `maintenance_in_progress`
value to `true`, edit the message text below (preserving indentation as
above!), then restart the web2py server. Now users who attempt to create or
edit a study will be blocked from doing so, and will see the HTML in
`maintenance_notice' in a popup. (The intent is to avoid someone starting an
edit session, then having their changes locked out of the system.)

Of course, once you're ready to restore the sites, remove/disable the apache
redirects above and reset `maintenance_in_progress` to `false` in the curation
app's `private/config` file. (Or just clobber it by pushing fresh code and
configuration to the web2py server.)
