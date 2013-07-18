# -*- coding: utf-8 -*-
from nexson2treemachine import get_processing_paths_from_prefix, get_default_dir_dict, target_is_dirty, get_study_filename_list
from nexson2treemachine import get_list_of_dirty_nexsons, download_nexson_from_phylografter, LockPolicy
from nexson2treemachine import run_treemachine_pg_import_check, htmlize_treemachine_output
import json
import sys
import subprocess
VERBOSE = False
if VERBOSE:
    import sys
### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

def _get_nexson_proc_conf(request):
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
        d = {}
        d['nexsons_dir'] = conf.get('paths', 'nexsonsdir')
        d['treemachine_domain'] = conf.get('domains', 'treemachine')
        d['study_to_status_script'] = conf.get('paths', 'study_to_status_script')
    except:
        raise HTTP(501, T('Server is not configured to report on NexSON status'))
    if (not os.path.exists(d['nexsons_dir'])) or (not os.path.isdir(d['nexsons_dir'])):
        raise HTTP(501, T('Server is not properly configured to report on NexSON status'))
    return d

def index():
    #####
    # grab the install-time variables...
    #
    c = _get_nexson_proc_conf(request)
    nexsons_dir = c['nexsons_dir']
    response.title = 'List of known study status pages'
    dd = get_default_dir_dict(nexsons_dir)
    x = os.listdir(nexsons_dir)
    study_list = []
    for study_id in x:
        try:
            study_id_as_int = int(study_id)
            study_list.append((study_id_as_int, study_id))
        except:
            continue
    study_list.sort()
    study_status_list = []
    for study_id_as_int, study_id in study_list:
        paths = get_processing_paths_from_prefix(study_id, **dd)
        check_lock_policy = LockPolicy()
        check_lock_policy.early_exit_if_locked = True
        nexson_path = paths['nexson']
        study_link = URL(a=request.application, 
                         c=request.controller,
                         f='status',
                         args=[study_id])
        el = {  'study_id': study_id,
                'status_link': study_link,
                'has_status': False,
                'message_link_list': []
            }
        lockfile = nexson_path + '.studylock'
        study_was_locked, owns_study_lock = check_lock_policy.wait_for_lock(lockfile)
        try:
            treemachine_log_path = paths['treemachine_log']
            status_json = paths['status_json']
            if study_was_locked:
                el['message']='The status is being assessed.'
            elif not target_is_dirty([nexson_path, treemachine_log_path], [status_json]):
                el['has_status'] = True
                el['message'] = 'Status is available'
            else:
                processing_launched_ts = paths['launched_study_proc']
                if os.path.exists(processing_launched_ts) and target_is_dirty([processing_launched_ts], [status_json]):
                    # the study is not currently being processed, the status_json is out of date, and the status_json is younger than
                    #   the 'study processing has been launched flag' This means that the processing failed
                    # We don't want to fall through hear and launch again, because that could
                    #   lead to lots of processing getting launched as a problematic case repeatedly fails
                    el['message'] = 'Error in status assessment. Please add this study id (%s) to the following issue tracking document (if it is not already listed):' % study_id
                    el['message_link_list'] = [('Study/status problems document.', 'https://docs.google.com/spreadsheet/ccc?key=0AnYfNFYgyCWkdGRhUGNlbE8xVk9UNE1SV1NDTzBCdEE#gid=0')]
                else:
                    el['message']= 'The status of this study has not been assessed.'
        finally:
            check_lock_policy.remove_lock()
        study_status_list.append(el)
    return {'study_status_list' : study_status_list}


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
    #####
    # grab the install-time variables...
    #
    c = _get_nexson_proc_conf(request)
    nexsons_dir = c['nexsons_dir']
    treemachine_domain = c['treemachine_domain']
    study_to_status_script = c['study_to_status_script']
    
    force_phylografter_reload = request.get_vars.get('fetchnexson') is not None
    
    response.title = 'Status page for study ' + str(study_id)
    dd = get_default_dir_dict(nexsons_dir)
    paths = get_processing_paths_from_prefix(study_id, **dd)
    check_lock_policy = LockPolicy()
    check_lock_policy.early_exit_if_locked = True
    nexson_path = paths['nexson']
    lockfile = nexson_path + '.studylock'
    study_was_locked, owns_study_lock = check_lock_policy.wait_for_lock(lockfile)
    try:
        treemachine_log_path = paths['treemachine_log']
        status_json = paths['status_json']
        if study_was_locked:
            return {'has_status': False,
                    'message': 'The processing of the information for this study is underway. Once it is complete the status will be displayed when this page reloads.'}
        ## the study is not currently being processed
        if not force_phylografter_reload:
            if not target_is_dirty([nexson_path, treemachine_log_path], [status_json]):
                rich_log = json.load(open(status_json, 'rU'))
                rich_log['force_fetch_url'] = URL(a=request.application, 
                                                  c=request.controller,
                                                  f=request.function,
                                                  args=[study_id], vars=dict(fetchnexson='True'))
                if emit_json:
                    return response.json(rich_log)
                rich_log['has_status'] = True
                return rich_log
            else:
                processing_launched_ts = paths['launched_study_proc']
                if os.path.exists(processing_launched_ts) and target_is_dirty([processing_launched_ts], [status_json]):
                    # the study is not currently being processed, the status_json is out of date, and the status_json is younger than
                    #   the 'study processing has been launched flag' This means that the processing failed
                    # We don't want to fall through hear and launch again, because that could
                    #   lead to lots of processing getting launched as a problematic case repeatedly fails
                    return {'has_status': False,
                        'message': 'The processing of the information for this study appears to have failed. Please add this study id (%s) to the following issue tracking document (if it is not already listed):' % study_id,
                        'message_link_list': [('Study/status problems document.', 'https://docs.google.com/spreadsheet/ccc?key=0AnYfNFYgyCWkdGRhUGNlbE8xVk9UNE1SV1NDTzBCdEE#gid=0')],
                        }
    finally:
        check_lock_policy.remove_lock()
    invoc = [sys.executable,
              study_to_status_script,
              treemachine_domain,
              '-d%s' % nexsons_dir,
              '-t', # run through treemachine if necessary
              '-s', # create the status JSON
              study_id
              ]
    if force_phylografter_reload:
        invoc.extend(['-l', '-n'])
        subprocess.Popen(invoc)
        return {'has_status': False,
                'message': 'The process of fetching the latest information for this study from phylografter has begun. Once it is complete the status will be displayed when this page reloads.'}
    # we will get here if:
    #       1. we are not fetching NexSON from phylografter, 
    #       2. we have not detected a lock indicating that the study is being processed, and
    #       3. the status_json is out of date
    subprocess.Popen(invoc)
    return {'has_status': False,
            'message': 'The process of analyzing previously downloaded information for this study is underway. Once it is complete the status will be displayed when this page reloads.'}
