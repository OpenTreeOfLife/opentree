# -*- coding: utf-8 -*-
from applications.opentree.modules.opentreewebapputil import(
    get_opentree_services_method_urls,
    extract_nexson_from_http_call,
    get_maintenance_info)
# N.B. This module is shared with tree-browser app, which is aliased as
# 'opentree'. Any name changes will be needed here as well!

from peyotl.manip import merge_otus_and_trees, iter_trees
import requests
from pprint import pprint
import json
#import pdb
# this file is released under public domain and you can use without limitations
import re

#########################################################################
## This is a samples controller
## - index is the default action of any application
## - user is required for authentication and authorization
## - download is for downloading files uploaded in the db (does streaming)
## - call exposes all registered services (none by default)
#########################################################################

def index():
    """
    Show an introduction page for visitors, or personalized curation dashboard for
    a logged-in user.
    """
    #response.flash = T("Welcome to web2py!")
    view_dict = get_opentree_services_method_urls(request)
    view_dict['maintenance_info'] = get_maintenance_info(request)

    if False:  ## auth.is_logged_in():
        # user is logged in, bounce to their personal dashboard
        redirect(URL('dashboard'))
    else:
        # anonymous visitor, show a general info page
        return view_dict

def collections():
    """
    Show a filtered list of all tree collections in the system.
    """
    view_dict = get_opentree_services_method_urls(request)
    view_dict['maintenance_info'] = get_maintenance_info(request)
    return view_dict
    
def error():
    return dict()

@auth.requires_login()
def dashboard():
    return dict(message="My Curation Activity")

def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    """
    return dict(form=auth())

def profile():
    """
    shows a personalized profile for any user (default = the current logged-in user) 
    http://..../{app}/default/profile/[username]
    """
    view_dict = get_opentree_services_method_urls(request)
    view_dict['maintenance_info'] = get_maintenance_info(request)

    # if the URL has a [username], try to load their information
    if len(request.args) > 0:
        # try to load a profile for the specified userid, using the GitHub API
        specified_userid = request.args[0]
        view_dict['userid'] = specified_userid
        view_dict['active_user_found'] = False

        # fetch the JSON for this user's activities
        json_response = _fetch_github_api(verb='GET', 
            url='/users/{0}'.format(specified_userid))

        error_msg = json_response.get('message', None)
        view_dict['error_msg'] = error_msg
        if error_msg:
            # pass error to the page for display
            print("ERROR FETCHING INFO FOR USERID: ", specified_userid)
            print(error_msg)
            view_dict['user_info'] = None
            view_dict['opentree_activity'] = None 
        else:
            # pass user info to the page for display
            view_dict['user_info'] = json_response
            activity = _get_opentree_activity( 
                userid=specified_userid, 
                username=view_dict['user_info'].get('name', specified_userid)
            )
            if activity:
                view_dict['active_user_found'] = True
            else:
                view_dict['active_user_found'] = False
                view_dict['error_msg'] = 'Not active in OpenTree'
            view_dict['opentree_activity'] = activity
        
        view_dict['is_current_user_profile'] = False
        if view_dict['active_user_found'] == True and auth.is_logged_in():
            current_userid = auth.user and auth.user.github_login or None
            if specified_userid == current_userid:
                view_dict['is_current_user_profile'] = True

        return view_dict

    else:
        # No userid was provided in the URL. Instead, we should try to bounce to the
        # current user's profile if they're logged in (or try to force a login).
        if auth.is_logged_in():
            current_userid = auth.user and auth.user.github_login or None
            # redirect to the fully expanded profile URL
            expanded_url = URL('curator', 'default', 'profile', 
                args=(current_userid,),
                vars=request.vars)
            redirect(expanded_url)
        else:
            # try to force a login and return here
            redirect(URL('curator', 'user', 'login',
                     vars=dict(_next=URL(args=request.args, vars=request.vars))))

def _fetch_github_api(verb='GET', url=None, data=None):
    # Wrapper for all (synchronous) calls to GitHub APIs
    #   'verb' should be GET or POST (when in doubt, send GET headers below)
    #   'url' should be root-relative (assume GitHub API)
    #   'data' could be passed via GET [TODO] or POST
    GH_BASE_URL = 'https://api.github.com'
    oauth_token_path = os.path.expanduser('~/.ssh/OPENTREEAPI_OAUTH_TOKEN')
    try:
        OPENTREEAPI_AUTH_TOKEN = open(oauth_token_path).read().strip()
    except:
        OPENTREEAPI_AUTH_TOKEN = ''
        print("OAuth token (%s) not found!" % oauth_token_path)

    # if the current user is logged in, use their auth token instead
    USER_AUTH_TOKEN = auth.user and auth.user.github_auth_token or None

    # Specify the media-type from GitHub, to freeze v3 API responses and get
    # the comment body as markdown (vs. plaintext or HTML)
    PREFERRED_MEDIA_TYPE = 'application/vnd.github.v3.raw+json'
    # to get markdown AND html body, use 'application/vnd.github.v3.full+json'

    GH_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%SZ'
    GH_GET_HEADERS = {'Authorization': ('token %s' % (USER_AUTH_TOKEN or OPENTREEAPI_AUTH_TOKEN)),
                      'Accept': PREFERRED_MEDIA_TYPE}
    GH_POST_HEADERS = {'Authorization': ('token %s' % (USER_AUTH_TOKEN or OPENTREEAPI_AUTH_TOKEN)),
                       'Content-Type': 'application/json',
                       'Accept': PREFERRED_MEDIA_TYPE}

    url = '{0}{1}'.format(GH_BASE_URL, url)
    if verb == 'POST':
        resp = requests.post( url, headers=GH_POST_HEADERS)
    else:
        resp = requests.get( url, headers=GH_GET_HEADERS)

    # Assume we always return JSON, even if it's an error message
    return resp.json()
    

def _get_opentree_activity( userid=None, username=None ):
    # Fetch information about a user's studies, comments, and collections in the
    # OpenTree project. If a dict was provided, add this information to it; else
    # bundle up the information and return it directly
    if not userid:
        return None
    activity_found = False
    activity = {
        'curator_since': None,
        'comments':[], 
        'issues': [], 
        'added_studies':[], 
        'curated_studies': [], 
        'curated_studies_in_synthesis': [], 
        'added_collections':[],
        'curated_collections':[]
    }
    method_dict = get_opentree_services_method_urls(request)

    # Use GitHub API to gather comments from this user, as shown in
    #   https://github.com/OpenTreeOfLife/feedback/issues/created_by/jimallman
    # N.B. that this is limited to 100 most recent items!
    all_comments = _fetch_github_api(verb='GET', 
        url='/repos/OpenTreeOfLife/feedback/issues/comments?per_page=100')
    for comment in all_comments:
        if comment.get('user', None):
            comment_author = comment.get('user').get('login')
            if comment_author == userid:
                activity.get('comments').append( comment )
                activity_found = True

    # Again, for all feedback issues created by them
    # N.B. that this is probably limited to 100 most recent items!
    created_issues = _fetch_github_api(verb='GET', 
        url='/repos/OpenTreeOfLife/feedback/issues?state=all&creator={0}&per_page=100'.format(userid))
    activity['issues'] = created_issues
    if len(created_issues) > 0:
        activity_found = True

    # fetch a list of all studies that contribute to synthesis
    fetch_url = method_dict['getSynthesisSourceList_url']
    if fetch_url.startswith('//'):
        # Prepend scheme to a scheme-relative URL
        fetch_url = "https:%s" % fetch_url
    # as usual, this needs to be a POST (pass empty fetch_args)
    source_data = requests.post(
        url=fetch_url,
        data={'include_source_list':True}
    ).json()
    source_id_map = source_data.get('source_id_map')
    # N.B. We can ignore the munged ids in source_data['source_list']
    
    contributing_study_info = { }   # build a dict with unique study IDs as keys, commit SHAs as values
    for source_id, source_details in source_id_map.iteritems():
        if 'taxonomy' in source_details:
            continue
        study_id = source_details.get('study_id')
        commit_SHA_in_synthesis = source_details.get('git_sha')
        contributing_study_info[ study_id ] = commit_SHA_in_synthesis

    # Use oti to gather studies curated and created by this user.
    fetch_url = method_dict['findAllStudies_url']
    if fetch_url.startswith('//'):
        # Prepend scheme to a scheme-relative URL
        fetch_url = "https:%s" % fetch_url
    all_studies = requests.post(
        url=fetch_url,
        data={'verbose': True}  # include curator list
    ).json().get('matched_studies', [ ])

    for study in all_studies:
        study_curators = study['ot:curatorName']
        # TODO: improve oti to handle multiple curator names!
        if type(study_curators) is not list:
            study_curators = [study_curators]
        if username in study_curators:
            activity_found = True
            activity['curated_studies'].append(study)
            # first curator name is its original contributor
            if study_curators[0] == username:
                activity['added_studies'].append(study)
            # does this contribute to synthesis?
            if contributing_study_info.has_key( study['ot:studyId'] ):
                activity['curated_studies_in_synthesis'].append(study)

    # Use oti to gather collections curated and created by this user.
    fetch_url = method_dict['findAllTreeCollections_url']
    if fetch_url.startswith('//'):
        # Prepend scheme to a scheme-relative URL
        fetch_url = "https:%s" % fetch_url
    all_collections = requests.get(url=fetch_url).json()
    for collection in all_collections:
        # gather all participants and check against their GitHub userids
        if userid == collection.get('creator', {}).get('login', None):
            activity_found = True
            activity['added_collections'].append(collection)
        contributor_ids = [c.get('login', None) for c in collection.get('contributors', [ ])]
        if userid in contributor_ids:
            activity_found = True
            activity['curated_collections'].append(collection)

    if activity_found:
        try:
            # search the repo stats (for each phylesystem shard!) for their earliest contribution
            earliest_activity_date = None  # TODO: make this today? or tomorrow? MAXTIME?
            fetch_url = method_dict['phylesystem_config_url']
            if fetch_url.startswith('//'):
                # Prepend scheme to a scheme-relative URL
                fetch_url = "https:%s" % fetch_url
            phylesystem_config = requests.get( url=fetch_url ).json()
            shard_list = phylesystem_config['shards']
            # if GitHub is rebuilding stats cache for any shard, poke them all but ignore dates
            rebuilding_cache = False
            for shard in shard_list:
                shard_name = shard['name']
                shard_contributors = _fetch_github_api(verb='GET', 
                    url='/repos/OpenTreeOfLife/{0}/stats/contributors'.format(shard_name))
                if type(shard_contributors) is not list:
                    # Flag this, but try to fetch remaining shards (to nudge the cache)
                    rebuilding_cache = True
                else:
                    for contrib_info in shard_contributors:
                        if contrib_info['author']['login'] == userid:
                            # look for the earliest week here
                            for week in contrib_info['weeks']:
                                if earliest_activity_date:
                                    earliest_activity_date = min(earliest_activity_date, week['w'])
                                else:
                                    earliest_activity_date = week['w']
                            break  # skip any remaining records

            if rebuilding_cache:
                activity['curator_since'] = 'Generating data, please try again in a moment...'
            elif not earliest_activity_date: 
                activity['curator_since'] = 'This user has not curated any studies.'
            else:
                # show a very approximate date (stats are just weekly)
                from datetime import datetime
                d = datetime.fromtimestamp(earliest_activity_date)
                activity['curator_since'] = d.strftime("%B %Y")
        except:
            # probably JSONDecodeError due to misconfiguration of the API server
            activity['curator_since'] = "Unable to determine this user's first activity"

        return activity
    else:
        return None

def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request, db)


def call():
    """
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    """
    return service()


@auth.requires_signature()
def data():
    """
    http://..../[app]/default/data/tables
    http://..../[app]/default/data/create/[table]
    http://..../[app]/default/data/read/[table]/[id]
    http://..../[app]/default/data/update/[table]/[id]
    http://..../[app]/default/data/delete/[table]/[id]
    http://..../[app]/default/data/select/[table]
    http://..../[app]/default/data/search/[table]
    but URLs must be signed, i.e. linked with
      A('table',_href=URL('data/tables',user_signature=True))
    or with the signed load operator
      LOAD('default','data.load',args='tables',ajax=True,user_signature=True)
    """
    return dict(form=crud())

def merge_otus():
    '''Takes a "nexson" arg that should be a NexSON blob.
    Returns an object with a "data" property that will be the NexSON
    with otus merged into the first otu group.

        1. merges trees elements 2 - # trees into the first trees element.,
        2. merges otus elements 2 - # otus into the first otus element.
        3. if there is no ot:originalLabel field for any otu,
            it sets that field based on @label and deletes @label
        4. merges an otu elements using the rule:
              A. treat (ottId, originalLabel) as a key
              B. If otu objects in subsequent trees match originalLabel and
                have a matching or absent ot:ottId, then they are merged into
                the same OTUs (however see C)
              C. No two leaves of a tree may share an otu (though otu should
                be shared across different trees). It is important that 
                each leaf node be mapped to a distinct OTU. Otherwise there
                will be no way of separating them during OTU mapping. we
                do this indirectly by assuring to no two otu objects in the
                same otus object get merged with each other (or to a common
                object)

        5. correct object references to deleted entities.

    This function is used to patch up NexSONs created by multiple imports, hence the 
    substitution of '@label' for 'ot:originalLabel'. Ids are arbitrary for imports from
    non-nexml tools, so matching is done based on names. This should mimic the behavior
    of the analysis tools that produced the trees (for most/all such tools unique names
    constitute unique OTUs).

    '''
    response.view = 'generic.json'
    # read NexSON from 'nexson' arg or (more likely) the request body
    nexson = extract_nexson_from_http_call(request, **request.vars)  # web2py equivalent to **kwargs
    
    try:
        o = merge_otus_and_trees(nexson)
        return {'data': o,
                'error': 0}
    except Exception, x:
        s = str(x)
        return {'error': 1,
                'description': s}

UPLOADID_PAT = re.compile(r'^[a-zA-Z_][-_.a-zA-Z0-9]{4,84}$')
ID_PREFIX_PAT = re.compile(r'^[a-zA-Z_][-_.a-zA-Z0-9]*$')
def to_nexson():
    global UPLOADID_PAT
    from externalproc import get_external_proc_dir_for_upload, get_logger, invoc_status, \
            ExternalProcStatus, get_conf, write_input_files, write_ext_proc_content, do_ext_proc_launch
    import os
    import datetime
    import codecs
    import locket
    import shutil
    import uuid
    from peyotl.nexson_syntax import can_convert_nexson_forms, \
                                     get_ot_study_info_from_nexml, \
                                     add_resource_meta, \
                                     convert_nexson_format, \
                                     BADGER_FISH_NEXSON_VERSION
    from peyotl.manip import count_num_trees
    '''
    Controller for conversion of NEXUS, newick, or NeXML to NeXSON
    Required arguments:
        "file" should be a multipart-encoded file to be translated to NexSON
          OR
        "content" which is a string that contains the content of the file
            format. "content" is checked if "file" is not provided.
    Required arguments for subsequent calls:
        "uploadId" - The "uploadId" returned from the first invocation
    Optional arguments:
        "uploadId" - A unique string for this upload (optional for *first* call
            only). This is no longer encouraged, since a uuid will be provided.
        "output" one of ['ot:nexson', 'nexson', 'nexml', 'input', 'provenance']
            the default is ot:nexson. This specifies what is to be returned.
            Possible values are: 
            "ot:nexson" is the Open Tree NexSON (with character data culled).
                This should be the first call. Subsequent
                calls can retrieve intermediates. JSON.
            "nexson" is the complete NexSON version of the data. JSON.
            "nexml" is the NeXML version of the file. This is an intermediate
                for the NexSON. XML.
            "input" returns the uploaded file. text/plain.
            "provenance" returns a simple, ad-hoc JSON with initial call details.
        "dataDeposit" should be a URL that should be added to the meta element
            in the Open Tree NexSON object.
        "inputFormat" should be "nexus", "newick", or "nexml"
            default is "nexus"
        "nexml2json" should be "0.0", "1.0", or "1.2". The more
            specific forms: "0.0.0", "1.0.0", or "1.2.1" will also work.
        "idPrefix" should be an empty string (or all whitespace) if you want 
                to use the firstAvailableXXXID args:
            firstAvailableEdgeID,
            firstAvailableNodeID,
            firstAvailableOTUID,
            firstAvailableOTUsID,
            firstAvailableTreeID,
            firstAvailableTreesID
          If idPrefix is not all whitespace it will be stripped, 
            the NCLconverter default names are used
          If idPrefix is not supplied, a uuid will be the prefix for the 
            names and the names will follow the NCL converter defaults

    N.B. Further documentation is available in curator/README.md
    '''
    _LOG = get_logger(request, 'to_nexson')
    if request.env.request_method == 'OPTIONS':
        raise HTTP(200, T('Preflight approved!'))
    orig_args = {}
    is_upload = False
    # several of our NexSON use "uploadid" instead of "uploadId" so we should accept either
    if ('uploadId' in request.vars) or ('uploadid' in request.vars):
        try:
            if ('uploadId' in request.vars):
                unique_id = request.vars.uploadId
            else:
                unique_id = request.vars.uploadid 
            unique_id = str(unique_id)
        except:
            raise HTTP(400, T('Illegal uploadId "{u}"'.format(u=unique_id)))
    else:
        is_upload = True
        unique_id = 'u' + str(uuid.uuid4())
    if not UPLOADID_PAT.match(unique_id):
        raise HTTP(400, T('uploadId must be series of letters, numbers, dots or dashes between 5 and 85 characters long. "{u}" does not match this pattern'.format(u=unique_id)))
    try:
        idPrefix = request.vars.idPrefix.strip()
    except:
        idPrefix = unique_id
    if idPrefix and (not ID_PREFIX_PAT.match(idPrefix)):
        raise HTTP(400, 'idPrefix must be start with a letter. "{u}" does not match this pattern'.format(u=idPrefix))
    
    output = request.vars.output or 'ot:nexson'
    output = output.lower()
    if output == 'ot%3anexson':
        # handle unwanted encoding (happens if file submitted)
        output = 'ot:nexson'
    output_choices = ['ot:nexson', 'nexson', 'nexml', 'input', 'provenance']
    if output not in output_choices:
        raise HTTP(400, 'The "output" should be one of: "{c}"'.format(c='", "'.join(output_choices)))
    try:
        working_dir = get_external_proc_dir_for_upload(request, '2nexml', unique_id, is_upload)
    except Exception, x:
        raise HTTP(404)
    if working_dir is None or (not os.path.exists(working_dir)):
        raise HTTP(404)
    _LOG.debug('created ' + working_dir)
    
    NEXSON_VERSION = request.vars.nexml2json or '0.0.0'
    if output.endswith('nexson') and (not can_convert_nexson_forms('nexml', NEXSON_VERSION)):
        raise HTTP(400, 'The "nexml2json" argument be "0.0", "1.0", or "1.2"')
    input_choices = ['nexus', 'newick', 'nexml']
    
    first_tree_available_trees_id = 0
    if is_upload:
        if 'inputFormat' not in request.vars:
            raise HTTP(400, T('The "inputFormat" argument must be supplied.'))
        inp_format = request.vars.inputFormat or 'nexus'
        inp_format = inp_format.lower()
        if inp_format not in input_choices:
            raise HTTP(400, 'inputFormat should be one of: "{c}"'.format(c='", "'.join(input_choices)))
        if output not in ['ot:nexson', 'nexson']:
            raise HTTP(400, 'The "output" argument should be "nexson" in the first call with each "uploadId"')
        orig_args['uploadId'] = unique_id
        orig_args['inputFormat'] = inp_format
        orig_args['idPrefix'] = idPrefix
        fa_tuples = [('first_tree_available_edge_id', 'firstAvailableEdgeID', 'e'), 
                     ('first_tree_available_node_id', 'firstAvailableNodeID', 'n'),
                     ('first_tree_available_otu_id', 'firstAvailableOTUID', 'o'),
                     ('first_tree_available_otus_id', 'firstAvailableOTUsID', 'O'),
                     ('first_tree_available_tree_id', 'firstAvailableTreeID', 't'),
                     ('first_tree_available_trees_id', 'firstAvailableTreesID', 'T'),]
        fa_dict = {}
        fa_flag = {}
        for t in fa_tuples:
            fa_dict[t[0]] = 0
            fa_flag[t[0]] = t[2]
        if not idPrefix:
            try:
                for t in fa_tuples:
                    p, h, c = t
                    if h in request.vars:
                        fa_dict[p] = int(request.vars[h])
                        assert(fa_dict[p] >= 0)
                        orig_args[h] = fa_dict[p]
            except:
                raise HTTP(400, T('firstAvailable***ID args must be non-negative integers'))
    INPUT_FILENAME = 'in.nex'
    PROV_FILENAME = 'provenance.json'
    RETURN_ATT_FILENAME = 'bundle_properties.json'
    NEXML_FILENAME = 'out.xml'
    ERR_FILENAME = 'err.txt'
    
    INPUT_FILEPATH = os.path.join(working_dir, INPUT_FILENAME)
    INP_LOCKFILEPATH = os.path.join(working_dir, INPUT_FILENAME + '.lock')
    RETURN_ATT_FILEPATH = os.path.join(working_dir, RETURN_ATT_FILENAME)
    inpfp = os.path.join(working_dir, INPUT_FILENAME)
    
    if is_upload:
        with locket.lock_file(INP_LOCKFILEPATH):
            if not os.path.exists(INPUT_FILEPATH):
                if request.vars.file is not None:
                    upf = request.vars.file
                    upload_stream = upf.file
                    filename = upf.filename
                elif request.vars.content is not None:
                    upload_stream = request.vars.content # stream is a bad name, but write_input_files does the write thing.
                    file_extensions = {'nexson':'.json', 'nexus':'.nex', 'nexml':'.nexml', 'newick':'.tre', 'relaxedphyliptree':'.tre'}
                    filename = 'PASTED%s' % (file_extensions.get(inp_format),)
                else:
                    raise HTTP(400, 'Expecting a "file" argument with an input file or a "content" argument with the contents of in input file')
                write_input_files(request, working_dir, [(INPUT_FILENAME, upload_stream)])
                prov_info = {
                    'filename' : filename,
                    'dateTranslated': datetime.datetime.utcnow().isoformat(),
                }
                if request.vars.dataDeposit:
                    prov_info['dataDeposit'] = request.vars.dataDeposit
                write_ext_proc_content(request,
                                       working_dir,
                                       [(PROV_FILENAME, json.dumps(prov_info))],
                                       encoding='utf-8')
                orig_args.update(prov_info)
                write_ext_proc_content(request,
                                       working_dir,
                                       [(RETURN_ATT_FILENAME, json.dumps(orig_args))],
                                       encoding='utf-8')

    if output == 'provenance':
        PROV_FILEPATH =  os.path.join(working_dir, PROV_FILENAME)
        response.view = 'generic.json'
        return json.load(codecs.open(PROV_FILEPATH, 'rU', encoding='utf-8'))
    if output == 'input':
        response.headers['Content-Type'] = 'text/plain'
        return open(INPUT_FILEPATH, 'rU').read()
    NEXML_FILEPATH = os.path.join(working_dir, NEXML_FILENAME)
    block = True
    timeout_duration = 0.1 #@TEMPORARY should not be hard coded`
    #@TEMPORARY could be refactored into a launch_or_get_status() call
    status = invoc_status(request, working_dir)
    launched_this_call = False
    if is_upload:
        if status == ExternalProcStatus.NOT_FOUND:
            inp_format = request.vars.inputFormat or 'nexus'
            inp_format = inp_format.lower()
            if inp_format not in input_choices:
                raise HTTP(400, 'inputFormat should be one of: "{c}"'.format(c='", "'.join(input_choices)))
            if inp_format == 'newick':
                inp_format = 'relaxedphyliptree'
            if inp_format == 'nexml':
                shutil.copyfile(INPUT_FILEPATH, NEXML_FILEPATH)
            else:
                try:
                    try:
                        exe_path = get_conf(request).get("external", "2nexml")
                    except:
                        _LOG.warn("Config does not have external/2nexml setting")
                        raise
                    assert(os.path.exists(exe_path))
                except:
                    response.view = 'generic.json'; return {'hb':exe_path}
                    _LOG.warn("Could not find the 2nexml executable")
                    raise HTTP(501, T("Server is not configured to allow 2nexml conversion"))
                invoc = [exe_path, '-f{f}'.format(f=inp_format), ]
                if inp_format == 'relaxedphyliptree':
                    invoc.extend(['-X', '-x'])
                if idPrefix:
                    invoc.append('-t{u}'.format(u=idPrefix))
                else:
                    invoc.append('-g')
                    for k, v in fa_dict.items():
                        if v > 0:
                            f = fa_flag[k]
                            invoc.append('-p{f}{v:d}'.format(f=f, v=v))
                invoc.append('in.nex')
                do_ext_proc_launch(request,
                                   working_dir,
                                   invoc,
                                   NEXML_FILENAME,
                                   ERR_FILENAME,
                                   wait=block)
                if not block:
                    time.sleep(timeout_duration)
                status = invoc_status(request, working_dir)
                assert(status != ExternalProcStatus.NOT_FOUND)
                launched_this_call = True
    if status == ExternalProcStatus.RUNNING:
        if not launched_this_call:
            time.sleep(timeout_duration)
            status = invoc_status(request, working_dir)
        if status == ExternalProcStatus.RUNNING:
            return HTTP(102, "Process still running")
    if status == ExternalProcStatus.FAILED:
        try:
            ERR_FILEPATH = os.path.join(working_dir, ERR_FILENAME)
            err_content = 'Error message:\n ' + open(ERR_FILEPATH, 'rU').read()
        except:
            err_content = ''
        response.headers['Content-Type'] = 'text/plain'
        raise HTTP(501, T("Conversion to NeXML failed.\n" + err_content))
    if output == 'nexml':
        response.headers['Content-Type'] = 'text/xml'
        return open(NEXML_FILEPATH, 'rU').read()
    NEXSON_FILENAME = 'nexson' + NEXSON_VERSION + '.json'
    NEXSON_FILEPATH = os.path.join(working_dir, NEXSON_FILENAME)
    NEXSON_DONE_FILEPATH = NEXSON_FILEPATH + '.written'
    NEXSON_LOCKFILEPATH = NEXSON_FILEPATH+ '.lock'
    if not os.path.exists(NEXSON_DONE_FILEPATH):
        try:
            with locket.lock_file(NEXSON_LOCKFILEPATH, timeout=0):
                if not os.path.exists(NEXSON_DONE_FILEPATH):
                    try:
                        dfj = get_ot_study_info_from_nexml(NEXML_FILEPATH,
                                                           nexson_syntax_version=NEXSON_VERSION)
                    except:
                        raise HTTP(400, T("Submitted data is not a valid NeXML file, or cannot be converted."))
                    out = codecs.open(NEXSON_FILEPATH, 'w', encoding='utf-8')
                    json.dump(dfj, out, indent=0, sort_keys=True)
                    out.write('\n')
                    out.close()
                    out = open(NEXSON_DONE_FILEPATH, 'w')
                    out.write('0\n')
                    out.close()
        except locket.LockError:
            return HTTP(102, "Conversion to NexSON still running")
    if output in ['nexson', 'ot:nexson']:
        response.view = 'generic.json'
        nex = json.load(codecs.open(NEXSON_FILEPATH, 'rU', encoding='utf-8'))
        num_trees = count_num_trees(nex, NEXSON_VERSION)
        r = {'data': nex}
        bundle_properties = json.load(codecs.open(RETURN_ATT_FILEPATH, 'rU', encoding='utf-8'))
        try:
            dd = bundle_properties.get('dataDeposit')
            if dd:
                n = nex.get('nex:nexml') or nex['nex']
                add_resource_meta(n, "ot:dataDeposit", dd, NEXSON_VERSION)
        except:
            pass
        r.update(bundle_properties)
        r['numberOfTrees'] = num_trees
        r['nexml2json'] = NEXSON_VERSION
        read_inp_format = bundle_properties.get('inputFormat', '')
        read_filename = bundle_properties.get('filename', '')

        # Since import was successful, we should copy the original data to a file in the supporting-files area
        if request.vars.file is not None:
            file_data = request.vars.file.file
        else:
            # mimic the expected upload file field by coercing pasted text to a file-like object
            import StringIO
            file_data = StringIO.StringIO()
            file_data.write( request.vars.content )
        file_data.seek(0)
        id = db.supporting_files.insert(doc = db.supporting_files.doc.store(file_data, str(read_filename)))
        # N.B. read_filename must be passed as a str! Unicode filename will
        # throw an error during insert() below, due to a bug in web2py (dal > _attempt_upload)

        # Compute size of the file and update the record
        record = db.supporting_files[id]
        path_list = []
        path_list.append(request.folder)
        path_list.append('uploads')
        path_list.append(record['doc'])
        size = os.path.getsize(os.path.join(*path_list))
         
        File = db(db.supporting_files.id==id).select()[0]
        db.supporting_files[id] = dict(file_size=size)
        db.supporting_files[id] = dict(study_id=response.study_id)
         
        # Put annotation- message information to a top-level property, so that
        # it can be added to the message collection in the main (nexml-level)
        # 'supporting-files-metadata' annotationEvent. This matches our current
        # policy for annotations; see 
        # https://github.com/OpenTreeOfLife/phylesystem-api/wiki/Annotations-in-NexSON#33-storage-and-placement-of-message-objects
        tree_ids = [tree_id for (tree_group_id, tree_id, imported_tree) in iter_trees(nex)]
        quoted_tree_ids = ["'{s}'".format(s=tree_id) for tree_id in tree_ids]
        r['annotationFileInfo'] = { 
            u'@filename': read_filename,
            u'@size': size,
            u'sourceForTree': [{'$':tree_id} for tree_id in tree_ids],
            u'@type': read_inp_format,
            u'@url': URL(f='download', args=[File['doc']]),
            u'description': {
                u'$': len(quoted_tree_ids) and "Source data for tree(s) {s}".format(s=', '.join(quoted_tree_ids)) or "No trees found in this file."
            }
        }
        return r
    assert (False)

# provide support for CrossRef.org URLs via HTTPS
def search_crossref_proxy():
    search_crossref_url = request.env.web2py_original_uri.split('search_crossref_proxy')[1]
    # prepend the real domain, using HTTP, and return the response
    search_crossref_url = 'http://search.crossref.org/%s' % search_crossref_url
    req = urllib2.Request(url=search_crossref_url) 
    try:
        resp = urllib2.urlopen(req).read()
    except:
        raise HTTP(501, "DOI lookup service failed. Please try again in a few minutes.")
    return resp

