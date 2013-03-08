opentree
========

Umbrella repo for opentree web site and services

Installation
============
Instructions coming soon. This is a webl2py application, so if you make
a link in a web2py/applications directory to this directory you should
see this app (see the phylografter instructions in the meantime for
more details about using web2py).

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
