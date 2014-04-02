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
    get_opentree_services_method_urls, fetch_current_TNRS_context_names)
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
    #view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    view_dict['studyID'] = request.args[0]
    view_dict['viewOrEdit'] = 'VIEW'
    view_dict['userCanEdit'] = auth.is_logged_in() and True or False;
    return view_dict

@auth.requires_login()
def create():
    view_dict = get_opentree_services_method_urls(request)
    view_dict['message'] = "study/create"
    return view_dict


@auth.requires_login()
def edit():
    # TODO: fetch a fresh list of search contexts for TNRS? see working example in
    # the header search of the main opentree webapp
    view_dict = get_opentree_services_method_urls(request)
    view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    view_dict['studyID'] = request.args[0]
    view_dict['viewOrEdit'] = 'EDIT'
    return view_dict


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


