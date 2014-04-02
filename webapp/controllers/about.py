# -*- coding: utf-8 -*-
from opentreewebapputil import (get_opentree_services_method_urls, 
                                fetch_current_TNRS_context_names)

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

def index():
    # bump to first About page in menu
    redirect(URL('about', 'open-tree-of-life'))

# try grabbing shared data just once
default_view_dict = get_opentree_services_method_urls(request)
default_view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)

# NOTE that web2py should attempt to convert hyphens (dashes) in URLs into underscores

def open_tree_of_life():
    # URL is /opentree/about/open-tree-of-life
    return default_view_dict

def the_synthetic_tree():
    # URL is /opentree/about/the-synthetic-tree
    return default_view_dict

def the_source_tree_manager():
    # URL is /opentree/about/the-source-tree-manager
    return default_view_dict

def developer_resources():
    return default_view_dict

def credits():
    return default_view_dict

def references():
    view_dict = default_view_dict.copy()
    view_dict['contributing_studies'] = fetch_current_synthesis_source_data()
    return view_dict

def fetch_current_synthesis_source_data():
    try:
        from gluon.tools import fetch
        import simplejson
        method_dict = get_opentree_services_method_urls(request)

        from pprint import pprint

        # fetch a list of all studies that contribute to synthesis
        fetch_url = method_dict['getSynthesisSourceList_url']
        ##pprint('==== getSynthesisSourceList_url ====')
        ##pprint(fetch_url)
        # as usual, this needs to be a POST (pass empty fetch_args)
        source_list_response = fetch(fetch_url, data='')
        source_list = simplejson.loads( source_list_response )
        ##pprint('==== source_list ====')
        ##pprint(source_list)
        # split these IDs, which are in the form '{STUDY_ID}_{TREE_ID}'
        contributing_study_ids = [id.split('_')[0] for id in source_list if id != "taxonomy"]
        pprint('==== len(contributing_study_ids) ====')
        pprint(len(contributing_study_ids))
        ##pprint('==== contributing_study_ids ====')
        ##pprint(contributing_study_ids)
        # remove duplicate study ID (due to multiple '{STUDY_ID}_{TREE_ID}' entries)
        contributing_study_ids = list(set(contributing_study_ids))
        pprint('==== DEDUPED len(contributing_study_ids) ====')
        pprint(len(contributing_study_ids))
        ##pprint('==== DEDUPED contributing_study_ids ====')
        ##pprint(contributing_study_ids)

        # fetch the oti metadata (esp. DOI and full reference text) for each
        fetch_url = method_dict['findAllStudies_url']
        ##pprint('==== findAllStudies_url ====')
        ##pprint(fetch_url)

        # as usual, this needs to be a POST (pass empty fetch_args)
        study_metadata_response = fetch(fetch_url, data={"verbose": True})
        study_metadata = simplejson.loads( study_metadata_response )
        pprint('==== len(study_metadata) ====')
        pprint(len(study_metadata))
        ##pprint('==== study_metadata ====')
        ##pprint(study_metadata)

        # filter just the metadata for studies contributing to synthesis
        contributing_studies = [study for study in study_metadata if study['ot:studyId'] in contributing_study_ids]
        pprint('==== len(contributing_studies) ====')
        pprint(len(contributing_studies))

        NON_contributing_studies = [study for study in study_metadata if study['ot:studyId'] not in contributing_study_ids]
        pprint('==== len(NON_contributing_studies) ====')
        pprint(len(NON_contributing_studies))

        # sort these alphabetically(?) and render in the page
        contributing_studies.sort(key = lambda x: x.get('ot:studyPublicationReference'))
        # TODO: encode data to utf-8?
        ## context_names += [n.encode('utf-8') for n in contextnames_json[gname] ]
        
        return contributing_studies

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)
