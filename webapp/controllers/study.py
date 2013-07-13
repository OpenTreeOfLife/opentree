# -*- coding: utf-8 -*-
from nexson2treemachine import get_processing_paths_from_prefix, get_default_dir_dict, target_is_dirty, get_study_filename_list
from nexson2treemachine import get_list_of_dirty_nexsons, download_nexson_from_phylografter, LockPolicy
from nexson2treemachine import run_treemachine_pg_import_check, htmlize_treemachine_output
import json
VERBOSE = False
if VERBOSE:
    import sys
### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

def status():
    study_id = request.args(0)
    if study_id is None:
        raise HTTP(404)
    emit_json = study_id.lower().endswith('.json')
    study_id = study_id.split('.')[0]
    try:
        ls = long(study_id)
        assert ls > 0
    except:
        raise HTTP(404)
    def get_conf(request): #@TEMP this get_conf should probably move to a module 
        conf = SafeConfigParser({})
        try:
            if os.path.isfile("applications/%s/private/localconfig" % request.application):
                conf.read("applications/%s/private/localconfig" % request.application)
            else:
                conf.read("applications/%s/private/config" % request.application)
        except:
            pass  #@TEMP probably should log this event...
        return conf
    
    conf = get_conf(request)
    try:
        nexsons_dir = conf.get('paths', 'nexsonsdir')
        treemachine_domain = conf.get('domains', 'treemachine')
    except:
        raise HTTP(501, T('Server is not configured to report on NexSON status'))
    if (not os.path.exists(nexsons_dir)) or (not os.path.isdir(nexsons_dir)):
        raise HTTP(501, T('Server is not properly configured to report on NexSON status'))
    
    dd = get_default_dir_dict(nexsons_dir)
    dirty_nexsons, download_db = get_list_of_dirty_nexsons(dd)
    dirty_nexsons = [str(i) for i in dirty_nexsons]
    
    paths = get_processing_paths_from_prefix(study_id, **dd)
    lock_policy = LockPolicy()
    #################
    # grab the paths
    #################
    nexson_path = paths['nexson']
    treemachine_log_path = paths['treemachine_log']
    treemachine_err_path = paths['treemachine_err']
    html_path = paths['html']
    html_err_path = paths['html_err']
    status_json = paths['status_json']
    #################
    # get NexSON
    #################
    if study_id in dirty_nexsons:
        dirty_nexsons.remove(study_id)
        if VERBOSE:
            sys.stderr.write('"%s" is dirty\n' % nexson_path)
        if not download_nexson_from_phylografter(paths, download_db, lock_policy):
            raise HTTP(501, T('Obtainging the NexSON file for this study failed'))
    elif VERBOSE:
        sys.stderr.write('"%s" is clean\n' % nexson_path)
    #####################
    # get treemachine log
    #####################
    needs_updating = target_is_dirty([nexson_path], [treemachine_log_path])
    if needs_updating:
        if VERBOSE:
            sys.stderr.write('"%s" is dirty\n' % treemachine_log_path)
        run_treemachine_pg_import_check(paths, treemachine_domain=treemachine_domain)
    elif VERBOSE:
        sys.stderr.write('"%s" is clean\n' % treemachine_log_path)
    #####################
    # parse treemachine log to html
    #####################
    needs_updating = target_is_dirty([nexson_path, treemachine_log_path], [html_path, status_json])
    if needs_updating:
        if VERBOSE:
            sys.stderr.write('"%s" is dirty\n' % treemachine_log_path)
        htmlize_treemachine_output(paths)
    elif VERBOSE:
        sys.stderr.write('"%s" is clean\n' % treemachine_log_path)
    rich_log = json.load(open(status_json, 'rU'))
    if emit_json:
        return response.json(rich_log)
    return rich_log