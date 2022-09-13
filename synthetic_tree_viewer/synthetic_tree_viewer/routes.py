def includeme(config):
    config.add_static_view('static', 'static', cache_max_age=3600)
    # match all explicit URLs before the default tree view

    # default synth-tree view (with catch-all path)
    config.add_route('tree_view', '/{full_path:.*}')
