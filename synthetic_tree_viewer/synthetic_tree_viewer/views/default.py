from pyramid.view import view_config
from synthetic_tree_viewer.opentreewebapputil import (
    get_user_display_name,
    get_auth_user,
    get_conf,
    get_domain_banner_text,
    get_domain_banner_hovertext,
    get_currently_deployed_opentree_branch,
    get_opentree_services_method_urls,
    latest_CrossRef_URL,
    fetch_current_TNRS_context_names,
    add_local_comments_markup,
    AUTH_CONFIG,
    login_required,
    )
from pyramid.httpexceptions import HTTPNotFound, HTTPSeeOther
from pyramid_retry import RetryableException

import logging
log = logging.getLogger(__name__)

from authomatic import Authomatic
from authomatic.adapters import WebObAdapter  # incl. Pyramid

# auth using GitHub API, see https://authomatic.github.io/authomatic/reference/providers.html#authomatic.providers.oauth2.GitHub
authomatic = Authomatic(
    AUTH_CONFIG, 
    'random OpenTree gobbledygook used for CSRF etc.',
    debug=True
    )

def fetch_current_synthetic_tree_ids(request):
    # return the latest synthetic-tree ID (and its 'life' node ID)
    try:
        # fetch the latest IDs as JSON from remote site
        import json
        import requests

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getDraftTreeID_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url

        fetch_args = {}
        # this needs to be a POST (pass fetch_args or ''); if GET, it just describes the API
        ids_json = requests.post(url=fetch_url, data=json.dumps(fetch_args), headers={"Content-Type": "application/json"}).json()
        draftTreeName = str(ids_json['synth_id'])
        startNodeID = str(ids_json['root']['node_id'])
        return (draftTreeName, startNodeID)

    except Exception as e:
        # throw 403 or 500 or just leave it
        return ('ERROR', str(e))

# Disablng PhyloPic features for now...
#@view_config(route_name='phylopic_proxy')
#def phylopic_proxy(request):
#    # hit the PhyloPic API and fetch an SVG image (or URL?)
#    import pdb; pdb.set_trace()
#
#    #node_id = request.matchdict['node_id']
#    # examine the full path to customize this view
#    proxied_path = request.matchdict['proxied_path']
#    path_parts = proxied_path.split('/')
#
#    phylopic_url = proxied_path
#    # prepend the real domain, using HTTP, and return the response
#    phylopic_url = 'https://api.phylopic.org/%s' % proxied_path
#    import requests
#    try:
#        return requests.get(url=phylopic_url, timeout=10).content
#    except requests.exceptions.ReadTimeout as e:
#        raise HTTP(503, 'The attempt to fetch an image from phylopic timed out')
#    except:
#        raise HTTP(503, 'The attempt to fetch an image from phylopic failed')
#    return HTTPSeeOther(location='/opentree/argus')

@view_config(route_name='home')
def home(request):
    # redirect to default tree view
    return HTTPSeeOther(location='/opentree/argus')

@view_config(route_name='contact', renderer='synthetic_tree_viewer:templates/contact.jinja2')
@login_required
def contact(request):
    view_dict = get_opentree_services_method_urls(request)
    view_dict.update({
        'taxonSearchContextNames': fetch_current_TNRS_context_names(request),
        })
    add_local_comments_markup(request, view_dict)
    return view_dict

@view_config(route_name='oauth_login')  # TODO: does this need a template/renderer?
def login(request):
    # we'll redirect to any specified destination (or the Home page)
    _next = request.params.get('_next')
    if _next:
        request.session['_next'] = _next  # stash this in case we're not ready!
        # TODO: trim the query-string and redirect to this "bare" URL!
        bare_url = request.route_url('oauth_login')
        return HTTPSeeOther(location=bare_url)

    log.debug("NO DESTINATION in login (but maybe in session)...")
    # still here? then it's time to check login result and move forward
    login_result = authomatic.login(WebObAdapter(request, request.response), 'github')
    if login_result:
        log.debug("!!!!! login_result.error = %s", login_result.error)
    else:
        log.debug("!!!!! NO login_result")

    destination_url = request.session.get('_next', None) and request.session.get('_next') or '/'
    log.debug("destination_url=%s", destination_url)

    # NB - first time through, there's no login_result; but on redirect, there it is!
    if (login_result and login_result.user):
        # update full user info (name, email, etc) and stash in the current session
        log.debug("TRUE login_result '%s' AND TRUE user '%s'", login_result, login_result.user)
        login_result.user.update()
        log.debug("User after immediate update: %s", login_result.user.data)
        gh_user_data = login_result.user.data
        request.session['auth_user'] = {
            'login': gh_user_data['login'],
            'email': gh_user_data['email'],
            # NB - we rename some of its properties for legibility
            'display_name': gh_user_data['name'],             # "Jim Allman"
            'github_profile_url': gh_user_data['html_url'],   # "https://github.com/jimallman"
            'homepage_url': gh_user_data['blog'],             # "https://www.ibang.com/"
            'oauth_token': login_result.user.credentials.token,  # ???
        }
        # NOTE that we're currently using non-expiring credentials!

        """ RESTORE this "flat" strings-only approach if session dict is not reliable!
        request.session['github_login'] = gh_user_data['login']          # "jimallman"
        request.session['github_display_name']  = gh_user_data['name']   # "Jim Allman"
        request.session['github_email'] = gh_user_data['email']          # "jim@ibang.com"
        request.session['github_profile_url'] = gh_user_data['html_url'] # "https://github.com/jimallman"
        request.session['github_homepage_url'] = gh_user_data['blog']    # "https://www.ibang.com/"
        """
        request.session.changed()  # save the current session, to make sure we update mutable values

        # clear destination once we're done logging in
        request.session['_next'] = None   
        return HTTPSeeOther(location=destination_url)

    elif (login_result and not login_result.user):
        # we don't (yet) have a proper user object; what should happen here!?
        # bail and wait for proper login?
        log.debug("TRUE login_result '%s', BUT FALSE user '%s'  :-/", login_result, login_result.user)
        #request.make_body_seekable()
        #raise RetryableException
        pass
    else:
        ## no login_result yet; bail and wait for this
        log.debug("FALSE login_result '%s'... probably jumping to OAuth now", login_result)
        #request.make_body_seekable()
        #raise RetryableException
        pass

    request.response.text ="...still waiting..."
    return request.response

@view_config(route_name='tree_view', renderer='synthetic_tree_viewer:templates/tree_view.jinja2')
def tree_view(request):
    try:
        from urllib import unquote_plus
    except ImportError:
        from urllib.parse import unquote_plus

    #node_id = request.matchdict['node_id']
    # examine the full path to customize this view
    full_path = request.matchdict['full_path']
    path_parts = full_path.split('/')

    # provide view context for a dumb template

    # First, copy our boilerplate config vars (getDraftTreeID_url, etc)
    view_dict = get_opentree_services_method_urls(request)

    # retrieve latest synthetic-tree ID (and its 'life' node ID)
    # TODO: Refresh this periodically? or only when needed for initial destination?
    latestSyntheticTreeVersion, startingNodeID = fetch_current_synthetic_tree_ids(request)

    # Then add/override with these explicit key-value pairs
    view_dict.update({
        # NB - Duplicate keys will be resolved in favor of the values below!
        'conf': get_conf(request),  # needed for the footer diagnostics
        'project_name': 'synthetic tree viewer',
        #'session': request.session,
        'response': request.response,
        'registry': request.registry,
        'currently_deployed_opentree_branch': get_currently_deployed_opentree_branch(request),
        # NB - some values will be filled in (or modified) below
        'nodeID': '',
        'nodeName': '',
        'viewport': '',
        'taxonSearchContextNames': fetch_current_TNRS_context_names(request),
        'nudgingToLatestSyntheticTree': False,
        'forcedByURL': False,
        'draftTreeName': latestSyntheticTreeVersion,
        'startingNodeID': startingNodeID,
        'incomingDomSource': 'none',
        'showLegendOnLoad': request.params.get('show-legend') or False,
        'domain_banner_text': get_domain_banner_text(request),
        'domain_banner_hovertext': get_domain_banner_hovertext(request),
        })


    if request.params.get('parentWindowURL', None):
        plain_feedback_url = unquote_plus(request.params.get('parentWindowURL'))
        view_dict['feedbackParentWindowURL'] = plain_feedback_url
    else:
        view_dict['feedbackParentWindowURL'] = None

    # examine the path parts of the incoming URL to correctly target the view
    if len(path_parts) > 0:
        if path_parts[0] in ['argus', 'feedback', 'properties']:  # TODO: add 'onezoom','phylet', others?
            view_dict['viewer'] = path_parts[0]
        elif '@' in path_parts[0]:
            view_dict['domSource'], view_dict['nodeID'] = path_parts[0].split('@')
        else:
            # first arg is neither a viewer nor a proper node, which is a Bad Thing
            raise HTTPNotFound(body="404 NOT FOUND")
    if len(path_parts) > 1:
        if not view_dict['nodeID']:
        #if (not view_dict['nodeID']) and '@' in path_parts[1]:
            ds_and_node_id = path_parts[1].split('@')
            view_dict['domSource'] = ds_and_node_id[0]
            if len(ds_and_node_id) > 1:
                view_dict['nodeID'] = ds_and_node_id[1]
        else:
            view_dict['nodeName'] = path_parts[1]
    if len(path_parts) > 2:
        if not view_dict['nodeName']:
            view_dict['nodeName'] = path_parts[2]

    # replace any invalid 'domSource' (typically this is "ottol" or a synth-tree version)
    # with the latest synthetic tree version, and notify the user on the page
    #
    # N.B. that if this is unspecified ('none'), the user requested a shortened
    # URL (e.g. https://tree.opentreeoflife.org/) that resolves to the latest
    # synthetic tree.
    incomingDomSource = view_dict.get('domSource', None) or latestSyntheticTreeVersion
    view_dict['incomingDomSource'] = incomingDomSource
    if incomingDomSource not in ('ottol', latestSyntheticTreeVersion, ):
        view_dict['domSource'] = latestSyntheticTreeVersion
        view_dict['nudgingToLatestSyntheticTree'] = True
        # mark this as a redirect to a different resource
        request.response.status = 303

    # when all is said and done, do we have enough information to force the location?
    if incomingDomSource and view_dict['nodeID']:
        view_dict['forcedByURL'] = True

    view_dict['filter'] = 'skip_comments'
    add_local_comments_markup(request, view_dict)
    return view_dict
