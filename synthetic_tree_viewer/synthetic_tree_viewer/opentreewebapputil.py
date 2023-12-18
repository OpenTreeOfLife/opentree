# adapted from web2py (applications.opentree.modules.opentreewebapputil)
import os
import re
import configparser

_CONF_OBJ_DICT = {}

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
    return _CONF_OBJ_DICT.get(app_name)

def get_conf_as_dict(request):
    # convert config file to dict (for use in Jinja templates)
    config = get_conf(request)
    return {s:dict(config.items(s)) for s in config.sections()}

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

def get_user_display_name():
    # Determine the best possible name to show for the current logged-in user.
    # This is for display purposes and credit in study Nexson. It's a bit
    # convoluted due to GitHub's various and optional name fields.
    ###from gluon import current
    ###auth = current.session.auth or None
    ###if (not auth) or (not auth.get('user', None)):
        ###return 'ANONYMOUS'
    ###if auth.user.name:
        #### this is a preset display name
        ###return auth.user.name
    #### N.B. that auth.user.first_name and auth.user.last_name fields are not
    #### reliable in our apps! They're included for web2py compatibility, but we
    #### defer to the GitHub User API and use the 'name' field for this.
    ###if auth.user.username:
        #### compact userid is our last resort
        ###return auth.user.username
    #### no name or id found (this should never happen)
    ###return 'UNKNOWN'
    return 'TODO: Display Name'

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

