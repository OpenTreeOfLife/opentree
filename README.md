opentree
========

Umbrella repo for opentree web site and services

Installation
============
Instructions coming soon. In the meantime, see the phylografter instructions for
more details about using web2py.

The contents of the webapp subdirectory  are a web2py application.  Make a symbolic 
link called "opentree" in a web2py/applications directory to the webapp directory.
You should be able to launch web2py and see the app running at http://127.0.0.1:8000/opentree/

Briefly:

1. Download and unpack the source code version of web2py from 
http://www.web2py.com/examples/default/download MTH used version 2.4.2 of web2py

2. Create the sym link

<pre>
cd web2py/applications
ln -s /full/path/to/opentree/webapp opentree
</pre>

3. Install the argus repo in the javascript subdirectory (this will change if we
migrate the argus code to inside the opentree repo).

<pre>
cd /full/path/to/opentree/webapp/static/js
git clone git@github.com:OpenTreeOfLife/argus.git
</pre>

Note that if you do not have write-privileges to the argus repo, then you'll need to 
use git://github.com/OpenTreeOfLife/argus.git as the URL.

4. Launch web2py

<pre>
cd /full/path/to/web2py
python web2py.py --nogui -a '&lt;recycle&gt;'
</pre>

Where the -a flag is allowing you to reuse the previous admin password that you used
with this instance of web2py.

Subdirectories
--------------

mockup
: JAR's hand-written html that mock up the design of the site.

webapp/controllers
: python code executed by web2py when a URL is successfully mapped to a controller.

webapp/modules
: python code that can be imported and used by the web app, but is not exposed as controller

webapp/models
: code that describes the database structure used by the web app

webapp/views
: templates for the page content that is rendered in response to a query. The view is typically specific to a few controllers in the web app

webapp/static
: static content to be returned by the web app. Contains css, images and js subdirectories for commonly used items.

webapp/private
: the location to be used for storing installation-specific configuration information.

webapp/cron
: directory that stores commands to be executed periodically by the web2py framework when the app is running.

webapp/databases
: the location of the database files used by web2py.

webapp/languages
: web2py code for internationalization


webapp/cache, webapp/databases, webapp/errors, webapp/sessions, webapp/uploads
: directories used by web2py to store content associated with user's activities. Content here should not need to be committed to version control.
