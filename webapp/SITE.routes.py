# -*- coding: utf-8 -*-

# adapted from router.example.py
#
# NOTE that the addition of an app-specific 'opentree' router is required here,
# since opentree itself uses pattern-based (regex) routing, and the two can't be
# mixed. But this combination of site-level and app-level routers apparently lets
# us do the hyphen-mapping trick for nicer URLs.

# TODO: consider adding 
#   default_application 
#   root_static (for favicon and robots.txt) [I think these are on by default!]
#   domain
#   map_static ?

#  This simple router set overrides only the default application name,
#  but provides full rewrite functionality.
routers = dict(

    # base router
    BASE=dict(
        default_application='opentree',
    ),
    opentree=dict(
        map_hyphen=True,
    ),
)

# Specify log level for rewrite's debug logging
# Possible values: debug, info, warning, error, critical (loglevels),
#                  off, print (print uses print statement rather than logging)
# GAE users may want to use 'off' to suppress routine logging.
#
logging = 'debug'

# see router.example.py for (many) more options!

def __routes_doctest():
    '''
    Dummy function for doctesting routes.py.

    Use filter_url() to test incoming or outgoing routes;
    filter_err() for error redirection.

    filter_url() accepts overrides for method and remote host:
        filter_url(url, method='get', remote='0.0.0.0', out=False)

    filter_err() accepts overrides for application and ticket:
        filter_err(status, application='app', ticket='tkt')

    >>> import os
    >>> import gluon.main
    >>> from gluon.rewrite import load, filter_url, filter_err, get_effective_router
    >>> load(routes=os.path.basename(__file__))

    >>> filter_url('http://domain.com/abc', app=True)
    'welcome'
    >>> filter_url('http://domain.com/welcome', app=True)
    'welcome'
    >>> os.path.relpath(filter_url('http://domain.com/favicon.ico'))
    'applications/welcome/static/favicon.ico'
    >>> filter_url('http://domain.com/abc')
    '/welcome/default/abc'
    >>> filter_url('http://domain.com/index/abc')
    "/welcome/default/index ['abc']"
    >>> filter_url('http://domain.com/default/abc.css')
    '/welcome/default/abc.css'
    >>> filter_url('http://domain.com/default/index/abc')
    "/welcome/default/index ['abc']"
    >>> filter_url('http://domain.com/default/index/a bc')
    "/welcome/default/index ['a bc']"

    >>> filter_url('https://domain.com/app/ctr/fcn', out=True)
    '/app/ctr/fcn'
    >>> filter_url('https://domain.com/welcome/ctr/fcn', out=True)
    '/ctr/fcn'
    >>> filter_url('https://domain.com/welcome/default/fcn', out=True)
    '/fcn'
    >>> filter_url('https://domain.com/welcome/default/index', out=True)
    '/'
    >>> filter_url('https://domain.com/welcome/appadmin/index', out=True)
    '/appadmin'
    >>> filter_url('http://domain.com/welcome/default/fcn?query', out=True)
    '/fcn?query'
    >>> filter_url('http://domain.com/welcome/default/fcn#anchor', out=True)
    '/fcn#anchor'
    >>> filter_url('http://domain.com/welcome/default/fcn?query#anchor', out=True)
    '/fcn?query#anchor'

    >>> filter_err(200)
    200
    >>> filter_err(399)
    399
    >>> filter_err(400)
    400
    '''
    pass

if __name__ == '__main__':
    import doctest
    doctest.testmod()
