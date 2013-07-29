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

    # extend  base (site-wide) router
    BASE=dict(
        default_application='opentree',
    ),
    opentree=dict(
        # convert dashes (hyphens) in URLs to underscores in web2py controller+action names
        map_hyphen=True,

        # whitelist of known controllers, to decipher ambiguous URLs
        ## controllers=[ 
        ##     'default'
        ##     'about',
        ##     'subtrees',
        ##     'contact',
        ##     'plugin_localcomments',
        ##     'appadmin',
        ##     'user',
        ##     # these are currently unused...
        ##     # 'synthview',
        ##     # 'treeview',
        ##     # 'plugin_comments',
        ##     # 'plugin_tagging',
        ## ],
        #
        # NO, That seems really buggy. Just keep the default 'controllers'
        # behavior (scans teh opentree/controllers/ directory, then adds the
        # 'static' controller).

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

# Specify log level for rewrite's debug logging? (Can we do this here?)
# Possible values: debug, info, warning, error, critical (loglevels),
#                  off, print (print uses print statement rather than logging)
logging = 'debug'

def __routes_doctest():
    '''
    see router.example.py for example doctests
    '''
    pass

if __name__ == '__main__':
    import doctest
    doctest.testmod()
