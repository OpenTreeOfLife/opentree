# -*- coding: utf-8 -*-
from opentreewebapputil import get_opentree_services_method_urls

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

    if False:  ## auth.is_logged_in():
        # user is logged in, bounce to their personal dashboard
        redirect(URL('dashboard'))
    else:
        # anonymous visitor, show a general info page
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
    '''
    Controller for conversion of NEXUS, newick, or NeXML to NeXSON
    Required arguments:
        "uploadid" - A unique string for this upload.
        "file" should be a multipart-encoded file to be translated to NexSON
          OR
        "content" which is a string that contains the content of the file
            format. "content" is checked if "file" is not provided.
    Required arguments for subsequent calls:
        "uploadid" - The "uploadid" returned from the first invocation
    Optional arguments:
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
        "inputformat" should be "nexus", "newick", or "nexml"
            default is "nexus"
        "nexml2json" should be "0.0.0", "1.0.0", or "1.2.0"
        
    '''
    _LOG = get_logger(request, 'to_nexson')
    orig_args = {}
    is_upload = False
    if 'uploadid' in request.vars:
        try:
            unique_id = request.vars.uploadid
            unique_id = str(unique_id)
        except:
            raise HTTP(400, T('Illegal uploadid "{u}"'.format(u=unique_id)))
    else:
        is_upload = True
        unique_id = 'u' + str(uuid.uuid4())
    if not UPLOADID_PAT.match(unique_id):
        raise HTTP(400, T('uploadid must be series of letters, numbers, dots or dashes between 5 and 85 characters long. "{u}" does not match this pattern'.format(u=unique_id)))
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
    if output_choices == 'ot:nexson' and (not can_convert_nexson_forms('nexml', NEXSON_VERSION)):
        raise HTTP(400, 'The "nexml2json" argument be "0.0.0", "1.0.0", or "1.2.0"')
    input_choices = ['nexus', 'newick', 'nexml']
    
    first_tree_available_trees_id = 0
    if is_upload:
        inp_format = request.vars.inputformat or 'nexus'
        inp_format = inp_format.lower()
        if inp_format not in input_choices:
            raise HTTP(400, 'inputformat should be one of: "{c}"'.format(c='", "'.join(input_choices)))
        if output != 'ot:nexson':
            raise HTTP(400, 'The "output" argument should be "ot:nexson" in the first call with each "uploadid"')
        orig_args['uploadid'] = unique_id
        orig_args['inputformat'] = inp_format
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
                    filename = '<content provided as a string in a "content" rather than a file upload>'
                else:
                    raise HTTP(400, 'Expecting a "file" argument with an input file or a "content" argument with the contents of in input file')
                write_input_files(request, working_dir, [(INPUT_FILENAME, upload_stream)])
                prov_info = {
                    'filename' : filename,
                    'date-created': datetime.datetime.utcnow().isoformat(),
                }
                if request.vars.dataDeposit:
                    prov_info['data-deposit'] = request.vars.dataDeposit
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
            inp_format = request.vars.inputformat or 'nexus'
            inp_format = inp_format.lower()
            if inp_format not in input_choices:
                raise HTTP(400, 'inputformat should be one of: "{c}"'.format(c='", "'.join(input_choices)))
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
                    dfj = get_ot_study_info_from_nexml(NEXML_FILEPATH,
                                                       nexson_syntax_version=NEXSON_VERSION)
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
        r = {'data': nex}
        bundle_properties = json.load(codecs.open(RETURN_ATT_FILEPATH, 'rU', encoding='utf-8'))
        r.update(bundle_properties)
        return r
    assert (output == 'ot:nexson')

