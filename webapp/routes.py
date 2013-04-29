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
    # other special cases of standard routing? ADD HERE

    # capture remaining tree-view URLs for analysis and display
    ('/opentree/$anything', '/opentree/default/index/$anything'),

    # I'd prefer to use 'ottol:123' instead of 'ottol@123' for node source+ID,
    # but web2py rejects colons in URLs violently, even if I try to filter them:
    #('/opentree/(?P<p>.*?)@(?P<q>.*)', '/opentree/default/index/\g<p>_AT_\g<q>'),
)
