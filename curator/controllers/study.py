# -*- coding: utf-8 -*-

#########################################################################
## Manages and manipulates studies in the Open Tree curation tool
## - index()    lists all studies in the system? or just mine?
## - create()   makes a new study (incl. one-time imports, etc)
## - edit()     manages an existing study
## - delete() 
## - validate() AJAX checks study against a remote validation service?
## - load()     AJAX call to load from remote store
## - store()    AJAX call to save to remote store
#########################################################################

from applications.opentree.modules.opentreewebapputil import(
    get_opentree_services_method_urls, 
    fetch_current_TNRS_context_names,
    fetch_trees_queued_for_synthesis,
    get_maintenance_info)

# N.B. This module is shared with tree-browser app, which is aliased as
# 'opentree'. Any name changes will be needed here as well!

def index():
    """
    Show list searchable/filtered list of all studies
    (default filter = My Studies, if logged in?)
    """

    if auth.is_logged_in():
        # user is logged in, filter to their own studies by default?
        pass
    else:
        # anonymous visitor, show unfiltered list?
        pass

    return dict(message="study/index")


def view():
    """
    Allow any visitor to view (read-only!) a study on the 'master' branch

    ? OR can this include work-in-progress from a personal branch?
    """
    response.view = 'study/edit.html'
    view_dict = get_opentree_services_method_urls(request)
    view_dict['maintenance_info'] = get_maintenance_info(request)
    #view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    view_dict['studyID'] = request.args[0]
    view_dict['latestSynthesisSHA'], view_dict['latestSynthesisTreeIDs'] = _get_latest_synthesis_details_for_study_id(view_dict['studyID'])
    view_dict['viewOrEdit'] = 'VIEW'
    view_dict['userCanEdit'] = auth.is_logged_in() and True or False
    view_dict['treesQueuedForSynthesis'] = fetch_trees_queued_for_synthesis(request)
    return view_dict

@auth.requires_login()
def create():
    # Block (redirect) if we've suspended study editing
    maintenance_info = get_maintenance_info(request)
    if maintenance_info.get('maintenance_in_progress', False):
        redirect(URL('curator', 'default', 'index', vars={"maintenance_notice":"true"}))
        pass
    view_dict = get_opentree_services_method_urls(request)
    view_dict['message'] = "study/create"
    return view_dict


@auth.requires_login()
def edit():
    # Block (redirect) if we've suspended study editing
    maintenance_info = get_maintenance_info(request)
    if maintenance_info.get('maintenance_in_progress', False):
        redirect(URL('curator', 'study', 'view', 
            vars={"maintenance_notice":"true"}, 
            args=request.args))
    # Fetch a fresh list of search contexts for TNRS? see working example in
    # the header search of the main opentree webapp
    view_dict = get_opentree_services_method_urls(request)
    view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    view_dict['treesQueuedForSynthesis'] = fetch_trees_queued_for_synthesis(request)
    view_dict['studyID'] = request.args[0]
    view_dict['latestSynthesisSHA'], view_dict['latestSynthesisTreeIDs'] = _get_latest_synthesis_details_for_study_id(view_dict['studyID'])
    view_dict['viewOrEdit'] = 'EDIT'
    return view_dict


def _get_latest_synthesis_details_for_study_id( study_id ):
    # Fetch the last synthesis SHA *and* any tree IDs (from this study) from
    # treemachine. If the study is not found in contributing studies, return
    # None for both.
    try:
        import json
        import requests

        method_dict = get_opentree_services_method_urls(request)

        # fetch a list of all studies that contribute to synthesis
        fetch_url = method_dict['getSynthesisSourceList_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url
        # as usual, this needs to be a POST (pass empty fetch_args)
        source_list_response = requests.post(
            fetch_url, 
            headers={"Content-Type": "application/json"},
            data=json.dumps({'include_source_list':True})
        ).text
        source_dict = json.loads( source_list_response )['source_id_map']

        # fetch the full source list, then look for this study and its trees
        commit_SHA_in_synthesis = None
        current_study_trees_included = [ ]
        #print(source_dict)
        # ignore source descriptions (e.g. "ot_764@tree1"); just read the details
        for source_details in source_dict.values():
            if source_details.get('study_id', None) == study_id:
                # this is the study we're interested in!
                current_study_trees_included.append( source_details['tree_id'] )
                if commit_SHA_in_synthesis is None:
                    commit_SHA_in_synthesis = source_details['git_sha']
            # keep checking, as each tree will have its own entry
        return commit_SHA_in_synthesis, current_study_trees_included

    except Exception, e:
        # throw 403 or 500 or just leave it
        raise HTTP(500, T('Unable to retrieve latest synthesis details for study {u}'.format(u=study_id)))

@auth.requires_login()
def delete():
    return dict(message="study/delete")


@auth.requires_login()
def validate():
    return dict(message="study/validate")


@auth.requires_login()
def load():
    return dict(message="study/load")


@auth.requires_login()
def store():
    return dict(message="study/store")


