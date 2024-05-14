def includeme(config):
    config.add_static_view(name='static', path='synthetic_tree_viewer:static', cache_max_age=3600)

    # match all explicit URLs before the default tree view
    config.add_route('about', '/about')
    config.add_route('about_open_tree_of_life', '/about/open-tree-of-life')
    config.add_route('about_references', '/about/references')
    config.add_route('about_progress', '/about/progress')
    config.add_route('about_synthesis_release', '/about/synthesis-release{release:.*}')
    config.add_route('about_taxonomy_version', '/about/taxonomy-version{version:.*}')
    config.add_route('about_developer_resources', '/about/developer-resources')
    config.add_route('about_privacy_policy', '/about/privacy_policy')
    config.add_route('about_licenses', '/about/licenses')

    config.add_route('contact', '/contact')
    # add explicit route for OAuth redirect_uri
    config.add_route('oauth_login', '/opentree/user/login')

    # load local comments via AJAX
    config.add_route('local_comments', '/opentree/plugin_localcomments')
    # TODO: make a nicer/cleaner URL for this?

    # DISABLING PhyloPic features for now...
    ## provide support for phylopic searches and image display via HTTPS
    #config.add_route('phylopic_proxy', '/phylopic_proxy/{proxied_path:.*}')

    # default synth-tree view (with catch-all path)
    config.add_route('tree_view', '/opentree/{full_path:.*}')
    config.add_route('home', '/')
