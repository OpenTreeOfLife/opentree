# -*- coding: utf-8 -*-

# Smarter routing of tree-view URLs for opentree
#
# NOTE that this needs to be added to routes_app in the main web2py/routes.py file, like so:
#
#   routes_app = ((r'/(?P<app>welcome|admin|app)\b.*', r'\g<app>'),
#                (r'(.*)', r'opentree'),
#                (r'/?(.*)', r'opentree'))
#
# Or just copy (or copy the relevant lines from) the file 'web2py.routes.example.py'
# to file 'routes.py' in the main web2py directory.

routes_in = (
    # map incoming URLs to controller+action names and args

    # remap hyphens to underscores? REPLACED by smarter site-level routes.py! see 'SITE.routes.py'
    # ('/opentree/(?P<p>.*?)-(?P<q>.*)-(?P<r>.*)-(?P<s>.*)', '/opentree/\g<p>_\g<q>_\g<r>_\g<s>'),

    # all static stuff behaves normally
    ('/opentree/static/$anything', '/opentree/static/$anything'),
    ('/opentree/appadmin$anything', '/opentree/appadmin$anything'),
    ('/opentree/default/download_subtree/$anything', '/opentree/default/download_subtree/$anything'),
    ('/opentree/default/user/$anything', '/opentree/default/user/$anything'),
    ('/opentree/plugin_localcomments$anything', '/opentree/plugin_localcomments$anything'),
    # wiki "static" pages are on other routes
    ('/opentree/about$anything', '/opentree/about$anything'),
    ('/opentree/contact$anything', '/opentree/contact$anything'),
    # other special cases of standard routing? ADD HERE

    # capture remaining tree-view URLs for analysis and display
    # some callers (eg round-trip login via Janrain) will use a complete URL...
    ('/opentree/default/index/$anything', '/opentree/default/index/$anything'),
    ('/opentree/default/index', '/opentree/default/index'),
    # ...but generally they'll need expansion
    ('/opentree/treeview/', '/opentree/treeview/index'),
    ('/opentree/treeview', '/opentree/treeview/index'),
    ('/opentree/treeview/$anything', '/opentree/treeview/$anything'),
    ('/opentree/synthview/', '/opentree/synthview/index'),
    ('/opentree/synthview', '/opentree/synthview/index'),
    ('/opentree/synthview/$anything', '/opentree/synthview/$anything'),
    ('/opentree/$anything', '/opentree/default/index/$anything'),

    # I'd prefer to use 'ottol:123' instead of 'ottol@123' for node source+ID,
    # but web2py rejects colons in URLs violently, even if I try to filter them:
    #('/opentree/(?P<p>.*?)@(?P<q>.*)', '/opentree/default/index/\g<p>_AT_\g<q>'),

)

routes_out = (
    # reverse mapping or URLs above, from controller+action names to URL 
)

# minimal routing, copied from webapp/web2py.routes.example 
routes_app = (
    # (r'/(?P<app>welcome|admin|app)\b.*', r'\g<app>'),     # not clear what this actually does..
    (r'(.*)', r'opentree'),                                 # simple domain URL defaults to 'opentree' app
    (r'/?(.*)', r'opentree')                                # simple domain URL defaults to 'opentree' app
)

# TODO: consider moving everything to the more modern, paramatric router?
# see  https://github.com/web2py/web2py/blob/master/router.example.py
