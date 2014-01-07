# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

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

    if False:  ## auth.is_logged_in():
        # user is logged in, bounce to their personal dashboard
        redirect(URL('dashboard'))
    else:
        # anonymous visitor, show a general info page
        return dict()

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

def to_nexml():
    from externalproc import get_external_proc_dir_for_upload, get_logger, invoc_status, \
            ExternalProcStatus, get_conf, write_input_files, write_ext_proc_content
    import os
    import datetime
    import codecs
    import locket
    _LOG = get_logger(request, 'to_nexml')
    try:
        unique_id = request.vars.uploadid
        assert unique_id is not None
    except:
        raise HTTP(400, 'Expecting an "uploadid" argument with a unique ID for this upload')
    output = request.vars.output or 'ot:nexson'
    output = output.lower()
    output_choices = ['ot:nexson', 'nexson', 'nexml', 'input', 'provenance']
    if output not in output_choices:
        raise HTTP(400, 'Output should be one of: "{c}"'.format(c='", "'.join(output_choices)))
    try:
        working_dir = get_external_proc_dir_for_upload(request, '2nexml', unique_id)
    except Exception, x:
        raise HTTP(404)
    if working_dir is None or not os.path.exists(working_dir):
        raise HTTP(404)
    INPUT_FILENAME = 'in.nex'
    PROV_FILENAME = 'provenance.json'
    
    INPUT_FILEPATH = os.path.join(working_dir, INPUT_FILENAME)
    INP_LOCKFILEPATH = os.path.join(working_dir, INPUT_FILENAME + '.lock')
    inpfp = os.path.join(working_dir, INPUT_FILENAME)
    with locket.lock_file(INP_LOCKFILEPATH):
        if not os.path.exists(INPUT_FILEPATH):
            if request.vars.file is None:
                raise HTTP(400, 'Expecting a "file" argument with an input file')
            upf = request.vars.file
            upload_stream = upf.file
            write_input_files(request, working_dir, [(INPUT_FILENAME, upload_stream)])
            prov_info = {
                'filename' : upf.filename,
                'date-created': datetime.datetime.utcnow().isoformat(),
            }
            write_ext_proc_content(request,
                                   working_dir,
                                   [(PROV_FILENAME, json.dumps(prov_info))],
                                   encoding='utf-8')
    if output == 'provenance':
        PROV_FILEPATH =  os.path.join(working_dir, PROV_FILENAME)
        response.view = 'generic.json'
        return json.load(codecs.open(PROV_FILEPATH, 'rU', encoding='utf-8'))
    '''if output == 'ot:nexson':
        sentinel = os.path.join()
        if os.path.exists()
    if output == ''
    
    block = True
    timeout_duration = 0.1 #@TEMPORARY should not be hard coded

    out_filename = 'out.xml'
    err_filename = 'err.txt'
    #@TEMPORARY could be refactored into a launch_or_get_status() call
    status = invoc_status(request, working_dir)
    launched_this_call = False
    if status == ExternalProcStatus.NOT_FOUND:
        try:
            try:
                exe_path = get_conf(request).get("external", "2nexml")
            except:
                _LOG.warn("Config does not have external/2nexml setting")
                raise
            assert(os.path.exists(exe_path))
        except:
            _LOG.warn("Could not find the 2nexml executable")
            raise HTTP(501, T("Server is not configured to allow 2nexml conversion"))
        do_ext_proc_launch(request,
                           working_dir,
                           [exe_path, 'in.nex'],
                           out_filename,
                           err_filename,
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
            return HTTP(102, T("Process still running"))
    #@TEMPORARY /end of potential launch_or_get_status call...
    
    if status == ExternalProcStatus.FAILED:
        try:
            err_file = os.path.join(working_dir, err_filename)
            err_content = 'Error message:\n ' + open(err_file, 'rU').read()
        except:
            err_content = ''
        response.headers['Content-Type'] = 'text/xml'
        raise HTTP(501, T("Conversion to NeXML failed.\n" + err_content))
    output = os.path.join(working_dir, 'out.xml')
    response.headers['Content-Type'] = 'text/xml'
    return open(output, 'rU').read()
    '''