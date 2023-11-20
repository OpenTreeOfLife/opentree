from pyramid.view import view_config
from synthetic_tree_viewer.opentreewebapputil import (
    get_user_display_name,
    get_conf,
    get_conf_as_dict,
    get_domain_banner_text,
    get_domain_banner_hovertext,
    get_currently_deployed_opentree_branch,
    get_opentree_services_method_urls,
    latest_CrossRef_URL,
    fetch_current_TNRS_context_names,
    )
from pyramid.httpexceptions import (
    HTTPNotFound,
    HTTPSeeOther,
    )

def _minimal_about_viewdict(request):
    # First, copy our boilerplate config vars (getDraftTreeID_url, etc)
    view_dict = get_opentree_services_method_urls(request)

    # Then add/override with these explicit key-value pairs
    view_dict.update({
        # NB - Duplicate keys will be resolved in favor of the values below!
        'conf': get_conf(request),  # needed for the footer diagnostics
        'response': request.response,
        'registry': request.registry,
        'taxonSearchContextNames': fetch_current_TNRS_context_names(request),
        'domain_banner_text': get_domain_banner_text(request),
        'domain_banner_hovertext': get_domain_banner_hovertext(request),
        })

    if request.params.get('parentWindowURL', None):
        plain_feedback_url = unquote_plus(request.params.get('parentWindowURL'))
        view_dict['feedbackParentWindowURL'] = plain_feedback_url
    else:
        view_dict['feedbackParentWindowURL'] = None

    return view_dict


@view_config(route_name='about',
             renderer='synthetic_tree_viewer:templates/about/open_tree_of_life.jinja2')
def about_default_redirect(request):
    raise HTTPSeeOther(location='/about/open-tree-of-life')

@view_config(route_name='about_open_tree_of_life',
             renderer='synthetic_tree_viewer:templates/about/open_tree_of_life.jinja2')
@view_config(route_name='about_references',
             renderer='synthetic_tree_viewer:templates/about/references.jinja2')
@view_config(route_name='about_privacy_policy',
             renderer='synthetic_tree_viewer:templates/about/privacy_policy.jinja2')
def about_open_tree_of_life(request):
    # provide view context for a dumb template
    view_dict = _minimal_about_viewdict(request)

    view_dict['contributingStudies'] = ['a', 'b']

    return view_dict
