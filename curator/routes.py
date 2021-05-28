# -*- coding: utf-8 -*-

# adapted from router.example.py
 
# NOTE that this requires a parametric router in the web2py root directory.
# Let's keep all the important stuff here, and just copy a minimal router
# (SITE.routes.py) into the site root.

# NOTE that this (app-specific) routes.py file mainly defines a router by the
# same name. More general settings must be done in the main routes.py alongside
# the web2py/applications/ directory
#   root_static (for favicon.ico, robots.txt, etc)
#   routes_onerror (defines error pages per app, per error code, or defaults)
#   domain (maps domain names and ports to particular app)
# See SITE.routes.py for recommended settings.

routers = dict(
    opentree=dict(
        # convert dashes (hyphens) in URLs to underscores in web2py controller+action names
        map_hyphen=True,
    ),
)

# see router.example.py for (many) more options!
