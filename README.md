opentree
========

Umbrella repo for opentree web site and services


Subdirectories
--------------

mockup
: JAR's hand-written html that mock up the design of the site.

controllers
: python code executed by web2py when a URL is successfully mapped to a controller.

modules
: python code that can be imported and used by the web app, but is not exposed as controller

models
: code that describes the database structure used by the web app

views
: templates for the page content that is rendered in response to a query. The view is typically specific to a few controllers in the web app

static
: static content to be returned by the web app. Contains css, images and js subdirectories for commonly used items.

private
: the location to be used for storing installation-specific configuration information.

cron
: directory that stores commands to be executed periodically by the web2py framework when the app is running.

databases
: the location of the database files used by web2py.

languages
: web2py code for internationalization


cache, databases, errors, sessions, uploads
: directories used by web2py to store content associated with user's activities. Content here should not need to be committed to version control.
