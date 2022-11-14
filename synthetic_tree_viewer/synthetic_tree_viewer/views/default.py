from pyramid.view import view_config


@view_config(route_name='tree_view', renderer='synthetic_tree_viewer:templates/tree_view.jinja2')
def tree_view(request):
    from synthetic_tree_viewer.opentreewebapputil import (
        get_user_display_name,
        get_conf,
        get_domain_banner_text,
        get_domain_banner_hovertext,
        get_currently_deployed_opentree_branch,
        latest_CrossRef_URL,
        )
    #node_id = request.matchdict['node_id']
    # examine the full path to customize this view
    full_path = request.matchdict['full_path']
    path_parts = full_path.split('/')
    # provide view context for a dumb template
    # TODO: Add boilerplate config vars (getDraftTreeID_url, etc)
    return {
        'project_name': 'synthetic tree viewer',
        #'session': request.session,
        'response': request.response,
        'registry': request.registry,
        'currently_deployed_opentree_branch': 'TEST-BRANCH-NAME', # TODO get_currently_deployed_opentree_branch(request)
        #'route_url': request.route_url,  # FUNCTIONS DON'T WORK HERE!?
        'domain_banner_text': "TEST BANNER",  # TODO get_domain_banner_text(request)
        'domain_banner_hovertext': "<div>Some banner details</div>",  # TODO XML(get_domain_banner_hovertext(request))
        'conf': { },  # TODO conf = get_conf(request)
        }
