# -*- coding: utf-8 -*-

#########################################################################
## Manages and manipulates tree collections in the Open Tree curation tool
## - index()    lists all collections in the system (or filtered)
## - create()   makes a new collection (incl. one-time operations)
## - edit()     manages an existing collection
## - TODO: check_synthesis_status()   is it in the queue? same version(s)?
## - TODO: submit_for_synthesis()     attempt synthesis, with arguments
## - delete() 
## - validate() AJAX checks collection against a remote validation service?
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
    Show list searchable/filtered list of all collections
    (default filter = My Collections, if logged in?)
    """
    view_dict = get_opentree_services_method_urls(request)
    view_dict['maintenance_info'] = get_maintenance_info(request)
    if auth.is_logged_in():
        # user is logged in, filter to their own collections by default?
        pass
    else:
        # anonymous visitor, show unfiltered list?
        pass

    return view_dict


def view():
    """
    Allow any visitor to view (read-only!) a collection on the 'master' branch

    ? OR can this include work-in-progress from a personal branch?
    """
    response.view = 'collection/edit.html'
    view_dict = get_opentree_services_method_urls(request)
    view_dict['maintenance_info'] = get_maintenance_info(request)
    #view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    view_dict['collectionID'] = request.args[0]
    view_dict['latestSynthesisSHA'] = _get_latest_synthesis_details_for_collection_id(view_dict['collectionID'])
        # TODO: include latestSynthesisTreeIDs as second response item? as for studies
    view_dict['viewOrEdit'] = 'VIEW'
    view_dict['userCanEdit'] = auth.is_logged_in() and True or False
    view_dict['treesQueuedForSynthesis'] = fetch_trees_queued_for_synthesis(request)
    return view_dict

""" TODO: Remove this if not needed!
@auth.requires_login()
def create():
    # Block (redirect) if we've suspended curation
    maintenance_info = get_maintenance_info(request)
    if maintenance_info.get('maintenance_in_progress', False):
        redirect(URL('curator', 'default', 'index', vars={"maintenance_notice":"true"}))
        pass
    view_dict = get_opentree_services_method_urls(request)
    view_dict['message'] = "collection/create"
    return view_dict
"""

@auth.requires_login()
def edit():
    # Block (redirect) if we've suspended curation
    maintenance_info = get_maintenance_info(request)
    if maintenance_info.get('maintenance_in_progress', False):
        redirect(URL('curator', 'collection', 'view', 
            vars={"maintenance_notice":"true"}, 
            args=request.args))
    # Fetch a fresh list of search contexts for TNRS? see working example in
    # the header search of the main opentree webapp
    view_dict = get_opentree_services_method_urls(request)
    view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    view_dict['treesQueuedForSynthesis'] = fetch_trees_queued_for_synthesis(request)
    view_dict['collectionID'] = request.args[0]
    view_dict['latestSynthesisSHA'] = _get_latest_synthesis_details_for_collection_id(view_dict['collectionID'])
    view_dict['viewOrEdit'] = 'EDIT'
    return view_dict

@auth.requires_login()
def delete():
    return dict(message="collection/delete")


@auth.requires_login()
def validate():
    return dict(message="collection/validate")

""" TODO: Delete these methods if unused
"""
@auth.requires_login()
def load():
    return dict(message="collection/load")


@auth.requires_login()
def store():
    return dict(message="collection/store")

""" TODO: Adapt this for current collection status, based on new APIs """
def _get_latest_synthesis_details_for_collection_id( collection_id ):
    # Fetch the last SHA for this collection that was used in the latest
    # published Open Tree of Life synthesis. If this collection was not
    # included, return None.
    # TODO: Expect other information as well?
    try:
        import json
        import requests

        method_dict = get_opentree_services_method_urls(request)

        # fetch a list of all studies and collections that contribute to synthesis
        # TODO: Request that these fields be added
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
        # TODO: Confirm details and method calls to fetch any contributing collection SHAs!
        # Draft code is based on schema proposed in
        # https://github.com/OpenTreeOfLife/phylesystem-api/issues/228

        # fetch the full source list, then look for this study and its trees
        commit_SHA_in_synthesis = None
        # if key (collection ID, e.g. "opentreeoflife/default") matches, read its details
        for c_id, collection_details in source_dict.items():
            if c_id == collection_id:
                # this is the collection we're interested in!
                commit_SHA_in_synthesis = collection_details['git_sha']
        return commit_SHA_in_synthesis  # TODO: return more information?

        # fetch the full source list, then look for this collection and its SHA
        # if key (collection ID, e.g. "opentreeoflife/default") matches, read its details
        for c_id, collection_details in source_dict.items():
            if c_id == collection_id:
                commit_SHA_in_synthesis = collection_details['git_sha']
                return commit_SHA_in_synthesis  # TODO: return more values here?
        return None
    except Exception, e:
        # throw 403 or 500 or just leave it
        raise HTTP(500, T('Unable to retrieve latest synthesis details for collection {u}'.format(u=collection)))
