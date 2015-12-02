#!/usr/env python
import logging
import os
import sys
import json
import re
from gluon.http import HTTP

_CONF_OBJ_DICT = {}

def get_conf(request):
    global _CONF_OBJ_DICT
    app_name = request.application
    c = _CONF_OBJ_DICT.get(app_name)
    if c is None:
        from ConfigParser import SafeConfigParser
        c = SafeConfigParser({})
        # DON'T convert property names to lower-case!
        c.optionxform = str        

        lcp = "applications/%s/private/localconfig" % app_name
        if os.path.isfile(lcp):
            c.read(lcp)
        else:
            c.read("applications/%s/private/config" % app_name)
        _CONF_OBJ_DICT[app_name] = c
    return c

def get_logging_level(request):
    '''
    Converts a config files logging section, level attribute to a logging modules' 
    value (default is logging.INFO)
    '''
    conf = get_conf(request)
    try:
        level_str = conf.get("logging", "level").upper()
        if level_str == "NOTSET":
            return logging.NOTSET
        elif level_str == "DEBUG":
            return logging.DEBUG
        elif level_str == "INFO":
            return logging.INFO
        elif level_str == "WARNING":
            return logging.WARNING
        elif level_str == "ERROR":
            return logging.ERROR
        elif level_str == "CRITICAL":
            return logging.CRITICAL
        else:
            return logging.NOTSET
    except:
        return logging.INFO
    
def get_logger(request, name):
    '''
    Returns a logger object with the level set based on the config file
    '''
    logger = logging.getLogger(name)
    if not hasattr(logger, 'is_configured'):
        logger.is_configured = False
    if not logger.is_configured:
        level = get_logging_level(request)
        logging_formatter = logging.Formatter("%(levelname) 8s: %(message)s")
        logging_formatter.datefmt='%H:%M:%S'
        logger.setLevel(level)
        ch = logging.StreamHandler()
        ch.setLevel(level)
        ch.setFormatter(logging_formatter)
        logger.addHandler(ch)
        logger.is_configured = True
    return logger

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

def get_maintenance_info(request):
    '''
    Reads the local configuration to determine whether we're doing scheduled
    maintenance tasks that might interrupt some editing.
    to a newer system . In this case, we should block study editing and show a message 
    to the user.
    '''
    conf = get_conf(request)
    minfo = dict()
    try:
        minfo['maintenance_in_progress' ] = conf.getboolean("maintenance", "maintenance_in_progress")
        minfo['maintenance_notice' ] = conf.get("maintenance", "maintenance_notice")
    except: 
        minfo['maintenance_in_progress' ] = False
        minfo['maintenance_notice'] = ""
    return minfo

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
    from gluon import current
    auth = current.session.auth or None
    if (not auth) or (not auth.get('user', None)):
        return 'ANONYMOUS'
    if auth.user.name:
        # this is a preset display name
        return auth.user.name
    if auth.user.first_name and auth.user.last_name:
        # combined first and last is also good
        return '%s %s' % (auth.user.first_name, auth.user.last_name,)
    if auth.user.username:
        # compact userid is our last resort
        return auth.user.username
    # no name or id found (this should never happen)
    return 'UNKNOWN'

def get_user_login():
    # simply return the login (username)
    from gluon import current
    auth = current.session.auth or None
    if (not auth) or (not auth.get('user', None)):
        return 'ANONYMOUS'
    if auth.user.username:
        # compact userid is our last resort
        return auth.user.username
    # no name or id found (this should never happen)
    return 'UNKNOWN'

def get_domain_banner_text(request):
    # Add an optional CSS banner to indicate a test domain, or none if
    # we're on a production server.
    if request.env.http_host == 'devtree.opentreeoflife.org':
        return 'DEVELOPMENT'
    elif request.env.http_host == 'stagingtree.opentreeoflife.org':
        return 'STAGING'
    return ''

def get_domain_banner_hovertext(request):
    # Return optional hover-text for test domains, or none if
    # we're on a production server.
    if request.env.http_host == 'devtree.opentreeoflife.org':
        return 'This is the development site for Open Tree of Life. Data and services may not be up to date, or may be untested. Production version at tree.opentreeoflife.org'
    elif request.env.http_host == 'stagingtree.opentreeoflife.org':
        return 'This is the staging site for Open Tree of Life. Data and services may not be up to date, or may be untested. Production version at tree.opentreeoflife.org'
    return ''


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

def fetch_current_TNRS_context_names(request):
    try:
        # fetch the latest contextName values as JSON from remote site
        from gluon.tools import fetch
        import simplejson

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getContextsJSON_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url

        # as usual, this needs to be a POST (pass empty fetch_args)
        contextnames_response = fetch(fetch_url, data='')

        contextnames_json = simplejson.loads( contextnames_response )
        # start with LIFE group (incl. 'All life'), and add any other ordered suggestions
        ordered_group_names = unique_ordered_list(['LIFE','PLANTS','ANIMALS'] + [g for g in contextnames_json])
        context_names = [ ]
        for gname in ordered_group_names:
            # allow for eventual removal or renaming of expected groups
            if gname in contextnames_json:
                context_names += [n.encode('utf-8') for n in contextnames_json[gname] ]

        # draftTreeName = str(ids_json['draftTreeName']).encode('utf-8')
        return (context_names)

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)

def unique_ordered_list(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if x not in seen and not seen_add(x)]

# adapted from phylesystem-api/controllers/default.py (__extract_nexson_from_http_call)
def extract_nexson_from_http_call(request, **kwargs):
    """Returns the nexson blob from `kwargs` or the request.body"""
    try:
        # check for kwarg 'nexson', or load the full request body
        if 'nexson' in kwargs:
            nexson = kwargs.get('nexson', {})
        else:
            nexson = request.body.read()

        if not isinstance(nexson, dict):
            nexson = json.loads(nexson)
        if 'nexson' in nexson:
            nexson = nexson['nexson']
    except:
        # TODO: _LOG.exception('Exception getting nexson content in extract_nexson_from_http_call')
        raise HTTP(400, json.dumps({"error": 1, "description": 'NexSON must be valid JSON'}))
    return nexson

def get_currently_deployed_opentree_branch(request):
    """Read local git configuration and return the current branch"""
    # Backtrack to the real (vs. symlinked) filesystem path for this app
    real_app_path = os.path.realpath(request.folder)
    infilepath = os.path.join(real_app_path, '..', '.git', 'HEAD')
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
