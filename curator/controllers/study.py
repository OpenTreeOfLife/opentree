# -*- coding: utf-8 -*-
from opentreewebapputil import get_opentree_services_method_urls

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
    #view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names()
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
    view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names()
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


def fetch_current_TNRS_context_names():
    try:
        # fetch the latest contextName values as JSON from remote site
        from gluon.tools import fetch
        import simplejson

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getContextsJSON_url']
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

        # draftTreeName = ids_json['draftTreeName'].encode('utf-8')
        return (context_names)

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)

def unique_ordered_list(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if x not in seen and not seen_add(x)]
