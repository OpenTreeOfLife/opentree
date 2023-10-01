from pyramid.view import view_config
from synthetic_tree_viewer.opentreewebapputil import (
    get_user_display_name,
    get_conf,
    get_domain_banner_text,
    get_domain_banner_hovertext,
    get_currently_deployed_opentree_branch,
    get_opentree_services_method_urls,
    latest_CrossRef_URL,
    fetch_current_TNRS_context_names,
    )

@view_config(route_name='tree_view', renderer='synthetic_tree_viewer:templates/tree_view.jinja2')
def tree_view(request):
    #node_id = request.matchdict['node_id']
    # examine the full path to customize this view
    full_path = request.matchdict['full_path']
    path_parts = full_path.split('/')
    # provide view context for a dumb template
    # First, copy our boilerplate config vars (getDraftTreeID_url, etc)
    view_dict = get_opentree_services_method_urls(request)
    # Then add/override with these explicit key-value pairs
    view_dict.update({
        # NB - Duplicate keys will be resolved in favor of the values below!
        'project_name': 'synthetic tree viewer',
        #'session': request.session,
        'response': request.response,
        'registry': request.registry,
        'currently_deployed_opentree_branch': get_currently_deployed_opentree_branch(request),
        #'route_url': request.route_url,  # FUNCTIONS DON'T WORK HERE!?
        'taxonSearchContextNames': fetch_current_TNRS_context_names(request),
        'nudgingToLatestSyntheticTree': True,  # TODO
        'showLegendOnLoad': True,  # TODO
        'domain_banner_text': get_domain_banner_text(request),
        'domain_banner_hovertext': get_domain_banner_hovertext(request),
        'conf': get_conf(request)
        })
    return view_dict
