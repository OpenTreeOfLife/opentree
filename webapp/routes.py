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
    # all static stuff behaves normally
    ('/opentree/static/$anything', '/opentree/static/$anything'),
    ('/opentree/appadmin$anything', '/opentree/appadmin$anything'),
    ('/opentree/default/user/$anything', '/opentree/default/user/$anything'),
    ('/opentree/plugin_localcomments$anything', '/opentree/plugin_localcomments$anything'),
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
