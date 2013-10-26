# -*- coding: utf-8 -*-

# adapted from router.example.py

# NOTE that a bare-bones parametric router is required here, since we've switched
# to parametric routing for opentree and the two can't be mixed. The change
# was required to support hyphens in proper URLs!
#
# All the important stuff is in the app's router (opentree/webapp/routes.py).
# This is just enough to trigger parametric (vs. pattern-based) routing
# throughout the site.

routers = dict(
    # base router
    BASE=dict(
        default_application='opentree',

        root_static=[
            # look for these files in the default app's static/ directory
            'favicon.ico',
            'robots.txt',
        ],
    ),

    # for more routing rules, see routes.py (if any) inside each app's directory 
)

# error pages (for ALL APPS)
routes_onerror=[
  # ('init/400', '/opentree/default/login'),
  # ('curator/*', '/opentree/static/fail.html'),
  # ('*/404', '/opentree/static/cantfind.html'),
  # ('opentree/*', '/opentree/static/fail.html'),
  ('*/*', '/opentree/default/error'),
]

# Specify log level for rewrite's debug logging
# Possible values: debug, info, warning, error, critical (loglevels),
#                  off, print (print uses print statement rather than logging)
# GAE users may want to use 'off' to suppress routine logging.
#
logging = 'off'

def __routes_doctest():
    '''
    see router.example.py for example doctests
    '''
    pass

if __name__ == '__main__':
    import doctest
    doctest.testmod()
