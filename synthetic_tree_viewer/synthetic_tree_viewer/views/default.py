from pyramid.view import view_config


@view_config(route_name='tree_view', renderer='synthetic_tree_viewer:templates/tree_view.jinja2')
def tree_view(request):
    from applications.opentree.modules.opentreewebapputil import get_user_display_name,
                                                                 get_conf,
                                                                 get_domain_banner_text,
                                                                 get_domain_banner_hovertext,
                                                                 get_currently_deployed_opentree_branch,
                                                                 latest_CrossRef_URL
    #node_id = request.matchdict['node_id']
    # examine the full path to customize this view
    full_path = request.matchdict['full_path']
    path_parts = full_path.split('/')
    return {
               'project': 'synthetic tree viewer',
               'conf': { },  # TODO conf = get_conf(request)
               }
