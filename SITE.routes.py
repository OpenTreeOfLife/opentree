# -*- coding: utf-8 -*-

# adapted from router.example.py

# this is a meaningless change on an old branch (just for a test commit)

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
    ),
)

# Specify log level for rewrite's debug logging
# Possible values: debug, info, warning, error, critical (loglevels),
#                  off, print (print uses print statement rather than logging)
# GAE users may want to use 'off' to suppress routine logging.
#
#logging = 'debug'

def __routes_doctest():
    '''
    see router.example.py for example doctests
    '''
    pass

if __name__ == '__main__':
    import doctest
    doctest.testmod()
