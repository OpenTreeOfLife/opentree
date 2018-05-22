# opentree

This is the repository for the Open Tree of Life web applications, one of many subsystems making up
the Open Tree of Life project code.
For Open Tree of Life documentation, see
[the germinator repository's wiki](https://github.com/OpenTreeOfLife/germinator/wiki).
The 'deployment system' and web API documentation sources that formerly resided in this
repository now live in the [germinator repository](https://github.com/OpenTreeOfLife/germinator).
The following instructions have not been reviewed in a long time.
For local installation a better place to start might be
[this wiki page](https://github.com/OpenTreeOfLife/opentree/wiki/Installing-a-local-curator-and-tree-browser-test-server).

## Installation

We strongly recommend using a virtual environment to manage the version of
Python and installed modules.
We're currently running opentree with Python
v2.7.3.
Newer versions of python2.7 should work, but **NOTE that web2py is not
compatible with Python 3**.
The final invocation to create your virtualenv should look something like:
```
$ virtualenv --python=(which python2.7) --distribute env
$ source env
```

The included **requirements.txt** file lists known-good versions of all the required
python modules for opentree, plus a few convenience modules. To [install these modules 
using pip](http://www.pip-installer.org/en/latest/cookbook.html#requirements-files), 

<pre>
pip install -r requirements.txt
</pre>

### install web2py and link to applications

The contents of the webapp subdirectory are a web2py application.  Make a symbolic 
link called "opentree" in a web2py/applications directory to the webapp directory.
You should be able to launch web2py and see the app running at http://127.0.0.1:8000/opentree/

    wget --no-verbose -O web2py_2.8.2_src.zip \
        https://github.com/web2py/web2py/archive/R-2.8.2.zip
    unzip web2py_2.8.2_src.zip
    mv web2py_2.8.2_src web2py
    cd web2py/applications
    ln -s ../../webapp opentree
    cd -
    cp -p oauth20_account.py web2py/gluon/contrib/login_methods/
    cp -p rewrite.py web2py/gluon/
    cp -p custom_import.py web2py/gluon/
    cp -p SITE.routes.py web2py/routes.py


Optionally, you can install a second web2py app for the curation tool, which will also need a
symlink. This will be available at http://127.0.0.1:8000/curator/

    cd web2py/applications
    ln -s ../../curator curator
    cd -
    

### Launch web2py for debugging

   <pre>
   cd web2py
   python web2py.py --nogui -a '&lt;recycle&gt;'
   </pre>
   
   Where the -a flag is allowing you to reuse the previous admin password that you used
   with this instance of web2py.

## For an instance that allows logging in

   **To test with login and proper domain name**, modify your test system's
   `/etc/hosts` file (or equivalent) to resolve the domain `devtree.opentreeoflife.org`
   to localhost (127.0.0.1). Then run web2py on (privileged) port 80 like so:

   <pre>
   cd web2py
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
