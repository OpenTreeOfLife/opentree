opentree
========

Umbrella repo for opentree web site and services. Includes code for constructing the synthetic taxonomy.

[![Visit our IRC channel](https://kiwiirc.com/buttons/irc.freenode.net/opentreeoflife.png)](https://kiwiirc.com/client/irc.freenode.net/?nick=guest|?#opentreeoflife)


Installation
============
Instructions coming soon. In the meantime, see the phylografter instructions for
more details about using web2py.

We strongly recommend using a virtual environment to manage the version of
Python and installed modules. We're currently running opentree with Python
v2.7.3. Newer versions of python2.7 should work, but **NOTE that web2py is not
compatible with Python 3**.

If necessary, compile Python2.7 and use it when making your virtualenv.  You
should be able to safely install multiple versions of python using your
preferred package manager, or by configuring Python2.7 with the --prefix
option and 'make altinstall'.

So the final invocation to create your virtualenv should look something like:
```
$ virtualenv --python=/usr/bin/python2.7 --distribute <path/to/new/virtualenv/>
```

Or, if you're using virtualenvwrapper (http://virtualenvwrapper.readthedocs.org/en/latest/index.html):
```
$ mkvirtualenv --python=python2.7 --no-site-packages --distribute opentree
```

The included **requirements.txt** file lists known-good versions of all the required
python modules for opentree, plus a few convenience modules. To [install these modules 
using pip](http://www.pip-installer.org/en/latest/cookbook.html#requirements-files), 

<pre>
pip install -r requirements.txt
</pre>

The contents of the webapp subdirectory are a web2py application.  Make a symbolic 
link called "opentree" in a web2py/applications directory to the webapp directory.
You should be able to launch web2py and see the app running at http://127.0.0.1:8000/opentree/

There is now a second web2py app for the curation tool, which will also need a
symlink. This will be available at http://127.0.0.1:8000/curator/

Briefly:

1. Download and unpack the source code version of web2py from 
http://www.web2py.com/examples/default/download MTH used version 2.4.2 of web2py

NOTE: This version of web2py includes basic support for OAuth 2.0, but it needs a minor patch to support for login via the GitHub API v3.
(This is used for the curation UI, which uses GitHub for its datastore and attribution.) Replace this web2py file with a modified version in the same folder as this README:
<pre>
{web2py-2.4.4}/gluon/contrib/login_methods/oauth20_account.py
</pre>

2. Create the sym links for the main web app and the study curation tool.

<pre>
cd web2py/applications
ln -s /full/path/to/opentree/webapp opentree
ln -s /full/path/to/opentree/curator curator
</pre>

3. Customize web2py's site-wide routing behavior using "SITE.routes.py"

<pre>
# return to main web2py directory
cd ..  
cp /full/path/to/opentree/SITE.routes.py routes.py
</pre>

This routing file works in tandem with the opentree app router and lets us have
proper URLs with hyphens instead of underscores.

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

smasher
: construction of synthetic taxonomy. See https://github.com/OpenTreeOfLife/opentree/wiki/Open-Tree-Taxonomy for details

webapp/controllers
: python code executed by web2py when a URL is successfully mapped to a controller.

webapp/modules
: python code that can be imported and used by the webpp, but is not exposed as controller

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

curator/*
: similar subdirectories to those in webapp/* above

Acknowledgements
----------------
Argus uses Raphaeljs and jQuery libraries.

Arrow icons are from http://raphaeljs.com/icons those icons are licensed under the followin MIT license:

Copyright © 2008 Dmitry Baranovskiy

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
