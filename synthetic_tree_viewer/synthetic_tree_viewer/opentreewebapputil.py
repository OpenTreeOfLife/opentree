# adapted from web2py (applications.opentree.modules.opentreewebapputil)
import os
import re
import configparser
import functools

from pyramid.httpexceptions import (
    HTTPNotFound,
    HTTPSeeOther,
    )

_CONF_OBJ_DICT = {}

def get_github_client_secret():
    client_secret_path = "../private/GITHUB_CLIENT_SECRET"
    if os.path.isfile(client_secret_path):
        GITHUB_CLIENT_SECRET = open(client_secret_path).read().strip()
        return GITHUB_CLIENT_SECRET
    else:
        abs_path = os.path.abspath(client_secret_path)
        err_msg = "Client secret file ({}) not found!".format(abs_path)
        print(err_msg)
        raise Exception(err_msg)

def get_conf(request):
    # get app-specific settings (e.g. API URLs)
    global _CONF_OBJ_DICT

    app_name = request.registry.package_name
    if _CONF_OBJ_DICT.get(app_name) is None:
        from configparser import ConfigParser
        conf = ConfigParser()
        # DON'T convert property names to lower-case!
        conf.optionxform = str
        test_config_paths = [
            os.path.abspath("../private/localconfig"),  # rarely used, but takes priority
            os.path.abspath("../private/config"),       # most common location
        ]
        config_file_found = None
        try:
            for test_path in test_config_paths:
                if os.path.isfile(test_path):
                    config_file_found = test_path
                    conf.read(test_path)
                    break;
            assert 'apis' in conf.sections()
            _CONF_OBJ_DICT[app_name] = conf
        except:
            print("\n=== WEB-APP CONFIG NOT FOUND, INVALID, OR INCOMPLETE ===")
            if config_file_found == None:
                err_msg = "Webapp config not found! Expecting it in one of these locations:\n  {}".format(test_config_paths)
                print(err_msg)
                raise Exception(err_msg)
            err_msg = "Webapp config file ({}) is broken or incomplete (missing [apis] section)".format(config_file_found)
            print(err_msg)
            raise Exception(err_msg)
        # add our GitHub client secret from a separate file (kept out of source repo)
        conf.set("apis", "github_client_secret", get_github_client_secret())
    return _CONF_OBJ_DICT.get(app_name)

def get_domain_banner_text(request):
    # Add an optional CSS banner to indicate a test domain, or none if
    # we're on a production server.
    if request.domain == 'tree.opentreeoflife.org':
        return ''
    # all other domains (including 'devtree.opentreeoflife.org') should present as dev servers
    return 'DEVELOPMENT'

def get_domain_banner_hovertext(request):
    # Return optional hover-text for dev+test domains, or none if
    # we're on a production server.
    if request.domain == 'tree.opentreeoflife.org':
        return ""
    # all other domains (including 'devtree.opentreeoflife.org') should present as dev servers
    # N.B. Line lengths gradually change, since this text fits diagonally in the page corner.
    # Be sure to test any changes!
    return '<br/>'.join(["This is a development version",
                         "of the Open Tree of Life website!",
                         "Data and services may be out of date or",
                         "untested. The production site (the place to",
                         "do real work) is <a href='https://tree.opentreeoflife.org/'>tree.opentreeoflife.org</a>."])

def get_currently_deployed_opentree_branch(request):
    """Read local git configuration and return the current branch"""
    # Backtrack to the real (vs. symlinked) filesystem path for this app
    this_file_dir = os.getcwd()
    infilepath = os.path.join(this_file_dir, '..', '.git', 'HEAD')
    branch_name = 'NOT FOUND (app is not inside a git repo?)'
    try:
        infile = open(infilepath)
        for line in infile:
            if 'ref:' in line:
                # FOR EXAMPLE:
                #   ref: refs/heads/mystery-branch\n
                branch_name = line.split('/')[-1].strip()
                break
        infile.close()
    except:
        pass
    return branch_name

def latest_CrossRef_URL(url):
    if (not url):
        return ''
    return url.replace('http://dx.doi.org/', 'https://doi.org/')

def get_opentree_services_domains(request):
    '''
    Reads the local configuration to get the domains and returns a dictionary
        with keys:
            treemachine_domain
            taxomachine_domain
            oti_domain
            opentree_api_domain
        the values of the domain will contain the port (when needed)

    This is mainly useful for debugging because it lets developers use local
        instances of the service by tweaking private/conf (see private/conf.example)
    '''
    conf = get_conf(request)
    domain_pairs = conf.items('domains')
    domains = dict()
    for name, url in domain_pairs:
        domains[ "%s_domain" % name ] = url
    return domains

def get_opentree_services_method_urls(request):
    '''
    Reads the local configuration to build on domains and return a dictionary
        with keys for all domains AND their service methods, whose values are
        URLs combining domain and partial paths

    This is useful for debugging and for adapting to different ways of
        configuring services, eg, proxied through a single domain
        (see private/conf.example)
    '''
    domains = get_opentree_services_domains(request)

    conf = get_conf(request)
    url_pairs = conf.items('method_urls')
    method_urls = domains.copy()
    for mname, murl in url_pairs:
        # replace any domain tokens, eg, 'treemachine_domain'
        for dname, durl in domains.items():
            murl = murl.replace('{%s}' % dname, durl)
        method_urls[ mname ] = murl

    return method_urls

def get_user_display_name(request):
    # Determine the best possible name to show for the current logged-in user.
    # This is for display purposes and credit in study Nexson. It's a bit
    # convoluted due to GitHub's various and optional name fields.
    return request.session.get('github_display_name', 'ANONYMOUS')

def fetch_current_TNRS_context_names(request):
    try:
        # fetch the latest contextName values as JSON from remote site
        import requests

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getContextsJSON_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url

        # as usual, this needs to be a POST (pass empty fetch_args)
        contextnames_json = requests.post(url=fetch_url, data='').json()
        # start with LIFE group (incl. 'All life'), and add any other ordered suggestions
        ordered_group_names = unique_ordered_list(['LIFE','PLANTS','ANIMALS'] + [g for g in contextnames_json])
        context_names = [ ]
        for gname in ordered_group_names:
            # allow for eventual removal or renaming of expected groups
            if gname in contextnames_json:
                context_names += [n for n in contextnames_json[gname] ]

        # draftTreeName = str(ids_json['draftTreeName']).encode('utf-8')
        return (context_names)

    except Exception as e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)

def unique_ordered_list(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if x not in seen and not seen_add(x)]

treebase_deposit_doi = re.compile('//purl.org/phylo/treebase/phylows/study/TB2:S(?P<treebase_id>\d+)')
def get_data_deposit_message(raw_deposit_doi):
    # Returns a *compact* hyperlink (HTML) to study data, or an empty string if
    # no DOI/URL is found. Some cryptic dataDeposit URLs require more
    # explanation or a modified URL to be more web-friendly.
    #
    # NOTE that we maintain a client-side counterpart in
    # curator/static/js/study-editor.js > getDataDepositMessage
    raw_deposit_doi = raw_deposit_doi.strip()
    if raw_deposit_doi == '':
        return ''

    # TreeBASE URLs should point to a web page (vs RDF)
    # EXAMPLE: http://purl.org/phylo/treebase/phylows/study/TB2:S13451
    #    => http://treebase.org/treebase-web/search/study/summary.html?id=13451
    treebase_match = treebase_deposit_doi.search(raw_deposit_doi)
    if treebase_match:
        return ('<a href="http://treebase.org/treebase-web/search/study/summary.html?'+
               'id=%s" target="_blank">Data in Treebase</a>' % treebase_match.group('treebase_id'))
 
    # TODO: Add other substitutions?

    return ('<a target="_blank" href="%s">Data deposit DOI/URL</a>' % raw_deposit_doi)

# https://authomatic.github.io/authomatic/reference/adapters.html
# https://authomatic.github.io/authomatic/reference/providers.html#authomatic.providers.oauth2.GitHub
from authomatic.providers import oauth2
AUTH_CONFIG = {
    'github': {
        'id': 1,  # REQUIRED for login_result.user.to_dict(), but usually login_result.user.data is plenty of information
        'class_': oauth2.GitHub,
        'consumer_key': 'Iv1.226d54b87d23855d',   # WAS github_client_id
        'consumer_secret': get_github_client_secret(),
        'access_headers': {'User-Agent': 'Awesome-Octocat-App'},
        'scope': ['user', 'user:email' ],
        #'redirect_uri': 'https://devtree.opentreeoflife.org/opentree/user/login',   # MATCH the app configuration exactly
        ## NB - This is apparently replaced by the *current* URL, so its route must match exactly..
        ## It's POSSIBLE that we can define multiple redirect-uri's in Github app config, then specify one of them here
    }
 }

import logging
log = logging.getLogger(__name__)

def login_required(decorated_function):
    """
    A decorator for protected views. This should check for OAuth credentials
    and (if found) when they expire. If expiry is imminent, refresh them now!
    If credentials aren't found, login via OAuth, then bounce back to the current URL.
    """
    @functools.wraps(decorated_function)
    def wrapper(request, *args, **kwargs):
        # IF user is logged in, call this view normally; otherwise login (or refresh credentials)
        log.debug(">>> STARTING login_required wrapper...")
        user_is_logged_in = request.session.get('github_login', None) and True or False
        log.debug(">>> is user logged in? %s", user_is_logged_in)
        # NOTE that we're currently using non-expiring credentials!
        user_credentials_are_dying = False   
        if user_is_logged_in:
            if user_credentials_are_dying:
                # TODO: refresh credentials now (synchronous)
                pass
            return decorated_function(request, *args, **kwargs)
        else:
            # TODO: redirect to login view (then bounce back to the current URL)
            log.debug(">>> now we'll bounce to the login view...")
            relative_url = request.route_path('oauth_login', _query={'_next': request.url})
            log.debug(">>> here's the root-relative URL: {}".format(relative_url))
            return HTTPSeeOther(location=relative_url)

    return wrapper


def fetch_github_app_auth_token(request):
    # fetch a new token, or confirm that a known token is still current (or replace it)
    # see https://developer.github.com/v3/apps/#create-a-new-installation-token
    # TODO: include 'repository_ids' "feedback" (?)

    # build a new JWT, since they expire
    import python_jwt as jwt, jwcrypto.jwk as jwk, datetime, requests
    app_name = request.application
    if (app_name == 'curator'):
        pass
    else: # 'webapp' or 'opentree' (aliases)
        pass
    #key = jwk.JWK.generate(kty='RSA', size=2048)
    conf = get_conf(request)
    try:
        github_app_id = conf.get("apis", "github_app_id")
    except:
        raise Exception("[apis] github_app_id not found in config!")

    try:
        app_installation_id = conf.get("apis", "github_app_installation_id")
    except:
        raise Exception("[apis] github_app_installation_id not found in config!")

    # load our GitHub app's private key from a separate file (kept out of source repo)
    if os.path.isfile("applications/%s/private/GITHUB_APP_PRIVATE_KEY_PEM" % request.application):
        try:
            private_key_pem = open("applications/%s/private/GITHUB_APP_PRIVATE_KEY_PEM" % request.application).read().strip()
            private_key = jwk.JWK.from_pem(private_key_pem)
            #key_json = private_key.export(private_key=True)
        except:
            raise Exception("Invalid private-key .pem!")
    else:
        raise Exception("Private-key .pem file not found!")

    payload = {
        # issued at time
        'iat': datetime.timedelta(minutes=0),
        # JWT expiration time (10 min max)
        'exp': datetime.timedelta(minutes=10),
        # issuer? (GitHub app identifier)
        'iss': github_app_id,
    }
    app_jwt = jwt.generate_jwt(payload, private_key, 'RS256', datetime.timedelta(minutes=5))
    # use this JWT to request an auth token for the current GitHub app (bot)
    resp = requests.post( ("https://api.github.com/app/installations/%s/access_tokens" % app_installation_id),
                          headers={'Authorization': ('Bearer %s' % app_jwt),
                                   'Accept': "application/vnd.github.machine-man-preview+json"})
    resp_json = resp.json()
    try:
        new_token = resp_json.get("token")
    except:
        raise Exception("Installation token not found in JSON response!")
    return new_token
