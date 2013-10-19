# -*- coding: utf-8 -*-

# adapted from router.example.py
#
# NOTE that this requires a parametric router in the web2py root directory.
# Let's keep all the important stuff here, and just copy a minimal router
# (SITE.routes.py) into the site root.

# TODO: Consider adding 
#   root_static (for favicon and robots.txt)? I think these are handled by default!
#   domain (maps domain name to app)
#   map_static (?)

routers = dict(

    opentree=dict(
        # convert dashes (hyphens) in URLs to underscores in web2py controller+action names
        map_hyphen=True,

        default_controller='default',

        # whitelist of known functions in the default controller, to decipher ambiguous URLs
        functions=[
            'index',
            'error',
            'download_subtree',
            'fetch_current_synthetic_tree_ids',
            'fetch_current_TNRS_context_name',
            'user',     # implicit? inherited? and needed for login, logout, etc
        ],
        default_function='index',
    ),
)

# see router.example.py for (many) more options!
