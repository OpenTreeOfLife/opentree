webapp-tree-viewer
==================

This is the repository for the Open Tree of Life synthetic-tree viewer, one of many subsystems making up the Open Tree of Life project code. Previously, this was bundled in a common repo with the study-curation app, but we're breaking these apart as part of our conversion from web2py to Pyramid.

For Open Tree of Life documentation, see [the germinator repository's wiki](https://github.com/OpenTreeOfLife/germinator/wiki).

The following instructions have not been reviewed in a long time. For local installation a better place to start might be [this wiki page](https://github.com/OpenTreeOfLife/opentree/wiki/Installing-a-local-curator-and-tree-browser-test-server).

Installation
============

**TBD - pending changes in converting from web2py to the Pyramid framework.**

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

The file **requirements.in** captures our intentions, typically following the
latest version of each module unless frozen to address bugs or incompatibilities.

<pre>
# create a python3 venv inside the top-level folder
cd ~/repos/webapp-tree-viewer
export VENV="$(pwd)/venv"
python3 -m venv $VENV

# install the pinned set of known-good modules
pip install -r requirements.txt

# OR during development, try to update these using `requirements.in`
pip install -r requirements.in

# capture the resulting versions for production deploymentsl
$VENV/bin/pip freeze -r requirements.in > requirements.txt
# capture and save the full dependency tree for all modules
$VENV/bin/pipdeptree > pipdeptree.out
</pre>

The contents of the webapp subdirectory are a web2py application.  Make a symbolic 
link called "opentree" in a web2py/applications directory to the webapp directory.
You should be able to launch web2py and see the app running at http://127.0.0.1:8000/opentree/

There is now a second web2py app for the curation tool, which will also need a
symlink. This will be available at http://127.0.0.1:8000/curator/

Briefly:

1. Download and unpack the source code version of web2py from 
http://www.web2py.com/examples/default/download MTH used version 2.4.2 of web2py

   NOTE: This version of web2py includes basic support for OAuth 2.0, but it needs
   a minor patch to support for login via the GitHub API v3.  (The curation app
   uses GitHub for its datastore and attribution. The tree browser also uses it
   for its issue tracker, with optional authentication for convenience.) Replace
   this web2py file with a modified version in the same folder as this README:
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

   **To test with login and proper domain name**, modify your test system's
   `/etc/hosts` file (or equivalent) to resolve the domain `devtree.opentreeoflife.org`
   to localhost (127.0.0.1). Then run web2py on (privileged) port 80 like so:

   <pre>
   cd /full/path/to/web2py
   sudo python web2py.py --nogui -p 80 -a '&lt;recycle&gt;'
   </pre>

   **To test with local HTTPS**, modify your test system's
   `/etc/hosts` file as described above, then use a [web2py options file]() to
   support HTTP traffic on port 80 and HTTPS on port 443. This requires working
   key and cert files.
   to localhost (127.0.0.1). Then run web2py on (privileged) port 80 like so:

   <pre>
   cd /full/path/to/web2py
   sudo python web2py.py --verbose -L multiport_options.py
   </pre>

   This looks for the options file `multiport_options.py` in the same
   directory as `web2py.py`, with contents something like this:
   <pre>
   import os 
   interfaces = [(
                    '0.0.0.0',
                    80
                 ),
                 (
                    '0.0.0.0',
                    443,
                    '/Volumes/SecureFiles/.ssh/opentree/ssl-keys/opentreeoflife.org.key',
                    '/Volumes/SecureFiles/.ssh/opentree/ssl-keys/STAR_opentreeoflife_org.crt'
                 )]
   password = '<recycle>' 
   pid_filename = 'httpserver.pid' 
   log_filename = 'httpserver.log' 
   folder = os.getcwd() 
   </pre>

   Now you should be able to use production domain names, secure connections,
   and OAuth as in the production setup.

Subdirectories
--------------

**TBD - pending changes in converting from web2py to the Pyramid framework.**

Acknowledgements
----------------
Argus uses Raphaeljs and jQuery libraries.

Arrow icons are from http://raphaeljs.com/icons those icons are licensed under the followin MIT license:

Copyright © 2008 Dmitry Baranovskiy

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
