# -*- coding: utf-8 -*-
from opentreewebapputil import get_opentree_services_method_urls
import pdb

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


UPLOADID_PAT = re.compile(r'^[-_.a-zA-Z0-9]{5,85}$')
def to_nexml():
    global UPLOADID_PAT
    from externalproc import get_external_proc_dir_for_upload, get_logger, invoc_status, \
            ExternalProcStatus, get_conf, write_input_files, write_ext_proc_content, do_ext_proc_launch
    import os
    import datetime
    import codecs
    import locket
    import shutil
    from xml2jsonbadgerfish import to_badgerfish_dict, cull_for_ot_nexson
    '''
    Controller for conversion of NEXUS, newick, or NeXML to NeXSON
    Required arguments:
        "uploadid" - A unique string for this upload. It needs
            to match the pattern '^[-_.a-zA-Z0-9]{5,85}$'
            clash with a previously used ID will cause data from the
            previous upload to be returned.
        "file" should be a multipart-encoded file to be translated to NexSON
          OR
        "content" which is a string that contains the content of the file
            format. "content" is checked if "file" is not provided.
    Optional arguments:
        "output" one of ['ot:nexson', 'nexson', 'nexml', 'input', 'provenance']
            the default is ot:nexson. This specifies what is to be returned.
            Possible values are: 
            "ot:nexson" is the Open Tree NexSON (with character data culled).
                This should be the first call to this uploadid. Subsequent
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
        
    '''
    _LOG = get_logger(request, 'to_nexml')
    try:
        unique_id = request.vars.uploadid
        assert unique_id is not None
    except:
        raise HTTP(400, 'Expecting an "uploadid" argument with a unique ID for this upload')
    if not UPLOADID_PAT.match(unique_id):
        raise HTTP(400, 'uploadid must be series of letters, numbers, dots or dashes between 5 and 85 characters long. "{u}" does not match this pattern'.format(u=unique_id))
    output = request.vars.output or 'ot:nexson'
    output = output.lower()
    if output == 'ot%3anexson':
        # handle unwanted encoding (happens if file submitted)
        output = 'ot:nexson'
    output_choices = ['ot:nexson', 'nexson', 'nexml', 'input', 'provenance']
    if output not in output_choices:
        raise HTTP(400, 'The "output" should be one of: "{c}"'.format(c='", "'.join(output_choices)))
    try:
        working_dir = get_external_proc_dir_for_upload(request, '2nexml', unique_id)
    except Exception, x:
        raise HTTP(404)
    if working_dir is None or not os.path.exists(working_dir):
        raise HTTP(404)
    INPUT_FILENAME = 'in.nex'
    PROV_FILENAME = 'provenance.json'
    NEXML_FILENAME = 'out.xml'
    ERR_FILENAME = 'err.txt'
    
    INPUT_FILEPATH = os.path.join(working_dir, INPUT_FILENAME)
    INP_LOCKFILEPATH = os.path.join(working_dir, INPUT_FILENAME + '.lock')
    inpfp = os.path.join(working_dir, INPUT_FILENAME)
    input_choices = ['nexus', 'newick', 'nexml']
    with locket.lock_file(INP_LOCKFILEPATH):
        if not os.path.exists(INPUT_FILEPATH):
            if output != 'ot:nexson':
                raise HTTP(400, 'The "output" argument should be "ot:nexson" in the first call with each "uploadid"')
            if request.vars.file is not None:
                upf = request.vars.file
                upload_stream = upf.file
                filename = upf.filename
            elif request.vars.content is not None:
                upload_stream = request.vars.content # stream is a bad name, but write_input_files does the write thing.
                filename = '<content provided as a string in a "content" rather than a file upload>'
            else:
                raise HTTP(400, 'Expecting a "file" argument with an input file or a "content" argument with the contents of in input file')
            inp_format = request.vars.inputformat or 'nexus'
            inp_format = inp_format.lower()
            if inp_format not in input_choices:
                raise HTTP(400, 'inputformat should be one of: "{c}"'.format(c='", "'.join(input_choices)))
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
            do_ext_proc_launch(request,
                               working_dir,
                               [exe_path, '-f{f}'.format(f=inp_format),'in.nex'],
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
    NEXSON_FILENAME = 'nexson.json'
    NEXSON_FILEPATH = os.path.join(working_dir, NEXSON_FILENAME)
    NEXSON_DONE_FILEPATH = NEXSON_FILEPATH + '.written'
    NEXSON_LOCKFILEPATH = NEXSON_FILEPATH+ '.lock'
    if not os.path.exists(NEXSON_DONE_FILEPATH):
        try:
            with locket.lock_file(NEXSON_LOCKFILEPATH, timeout=0):
                if not os.path.exists(NEXSON_DONE_FILEPATH):
                    dfj = to_badgerfish_dict(NEXML_FILEPATH)
                    out = codecs.open(NEXSON_FILEPATH, 'w', encoding='utf-8')
                    json.dump(dfj, out, indent=0, sort_keys=True)
                    out.write('\n')
                    out.close()
                    out = open(NEXSON_DONE_FILEPATH, 'w')
                    out.write('0\n')
                    out.close()
        except locket.LockError:
            return HTTP(102, "Conversion to NexSON still running")
    if output == 'nexson':
        response.view = 'generic.json'
        return json.load(codecs.open(NEXSON_FILEPATH, 'rU', encoding='utf-8'))
    # Open Tree NeXSON - cull characters
    OT_NEXSON_FILENAME = 'ot_nexson.json'
    OT_NEXSON_FILEPATH = os.path.join(working_dir, OT_NEXSON_FILENAME)
    OT_NEXSON_DONE_FILEPATH = OT_NEXSON_FILEPATH + '.written'
    OT_NEXSON_LOCKFILEPATH = OT_NEXSON_FILEPATH+ '.lock'
    if not os.path.exists(OT_NEXSON_DONE_FILEPATH):
        try:
            with locket.lock_file(OT_NEXSON_LOCKFILEPATH, timeout=0):
                if not os.path.exists(OT_NEXSON_DONE_FILEPATH):
                    inf = codecs.open(NEXSON_FILEPATH, 'rU', encoding='utf-8')
                    full_nexson = json.load(inf)
                    cull_for_ot_nexson(full_nexson, data_deposit=request.vars.dataDeposit)
                    out = codecs.open(OT_NEXSON_FILEPATH, 'w', encoding='utf-8')
                    json.dump(full_nexson, out, indent=0, sort_keys=True)
                    out.write('\n')
                    out.close()
                    out = open(OT_NEXSON_DONE_FILEPATH, 'w')
                    out.write('0\n')
                    out.close()
        except locket.LockError:
            return HTTP(102, "Conversion to ot:NexSON still running")
    assert (output == 'ot:nexson')
    response.view = 'generic.json'
    nexson = json.load(codecs.open(OT_NEXSON_FILEPATH, 'rU', encoding='utf-8'))
    # pdb.set_trace()

    # TODO: store input file (or string) alongside uploaded supporting files? or provide special fetch method?
    imported_tree = nexson['nex:nexml']['trees']['tree']

    #### create or replace the file information for this 
    ###os.path.exists(INPUT_FILEPATH)

    imported_tree[ u'^ot:messages' ] = { 
        u'message': [ { 
            u'@id': "message{u}".format(u=unique_id),
            u'@code': u'SUPPORTING_FILE_INFO',
            u'@humanMessageType': u'NONE',
            u'@severity': u'INFO',
            u'@wasGeneratedBy': u'opentree.2nexml',
            # TODO: Do we need to add this agent to the main study?
            u'data': {
                u'@movedToPermanentArchive': False,
                u'files': {
                    u'file': [
                        {
                            u'@filename': INPUT_FILENAME,
                            u'@size': shutil.os.path.getsize(INPUT_FILEPATH),
                            u'@sourceForTree': imported_tree['@id'],
                            u'@type': inp_format,
                            u'@url': "/curator/default/to_nexml?output=input&uploadid={u}".format(u=unique_id),
                            u'description': {
                                u'$': "Source data for tree '{u}'".format(u=imported_tree['@id'])
                            }
                        }
                    ]
                }
            }
        } ]
    }

    # add supporting-file annotation for this tree (for curation UI and eventual data deposition)
    return nexson
