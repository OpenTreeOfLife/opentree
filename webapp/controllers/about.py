# -*- coding: utf-8 -*-
import json
from datetime import datetime
from opentreewebapputil import (get_opentree_services_method_urls, 
                                fetch_current_TNRS_context_names,
                                get_data_deposit_message,)

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

def licenses():
    return default_view_dict

def materials_and_methods():
    return default_view_dict

def references():
    view_dict = default_view_dict.copy()
    view_dict['contributing_studies'] = fetch_current_synthesis_source_data()
    return view_dict

def progress():
    view_dict = default_view_dict.copy()
    synth = json.loads(fetch_local_synthesis_stats() or '{}')
    phylesystem = json.loads(fetch_local_phylesystem_stats() or '{}')
    ott = json.loads(fetch_local_ott_stats() or '{}')
    # create some an otu summary stats for each synthesis that we have info about...
    by_date = {}
    warnings = set()
    dates = set(synth.keys() + phylesystem.keys())
    # Let's creep tallies up in our fake data, with starting values here
    import random
    num_otu_in_ott =        1920000
    num_otu_in_synth =       890000
    num_phylo_otu_in_synth =  70000
    num_otu_in_studies =     400000
    num_otu_in_nominated_studies = 390000
    warnings.add('Creeping OTU tallies added to show progression!')

    for date in sorted(dates, reverse=False):
        synth_v = synth.get(date, {})
        phyle_v = phylesystem.get(date, {})
        ott_version = synth_v.get('OTT version')
        num_otu_in_ott += random.randint(0,10000)
        if ott_version is None:
            ott_version = 'unknown'
            warnings.add('OTT version info not found - just making up some numbers as a placeholder!')
        elif ott is None:
            warnings.add('OTT info not found - just making up some numbers as a placeholder!')
        else:
            ov = ott.get(ott_version)
            if ov is None:
                warnings.add('ott info for version {v} of OTT not found - just making up some numbers as a placeholder!'.format(v=ott_version))
            else:
                num_otu_in_ott = ov['Unique OTUs']

        num_otu_in_synth += random.randint(0,5000)
        if synth_v.get('Unique OTUs in Synthesis') is None:
            warnings.add('"Unique OTUs in Synthesis" info not found - just making up some numbers as a placeholder!')
        else:
            num_otu_in_synth = synth_v.get('Unique OTUs in Synthesis')

        num_phylo_otu_in_synth += random.randint(0,3000)
        if synth_v.get('Unique OTUs in Synthesis from studies') is None:
            warnings.add('"Unique OTUs in Synthesis from studies" info not found - just making up some numbers as a placeholder!')
        else:
            num_phylo_otu_in_synth = synth_v.get('Unique OTUs in Synthesis from studies')

        num_otu_in_studies += random.randint(0,10000)
        if phyle_v.get('Unique OTUs') is None:
            warnings.add('"Unique OTUs" info not found for phylesystem - just making up some numbers as a placeholder!')
        else:
            num_otu_in_studies = phyle_v.get('Unique OTUs')

        num_otu_in_nominated_studies += random.randint(0,8000)
        if synth_v.get('Unique OTUs in nominated studies') is None:
            warnings.add('"Unique OTUs in nominated studies" info not found - just making up some numbers as a placeholder!')
        else:
            num_otu_in_nominated_studies = synth_v.get('Unique OTUs in nominated studies')

        by_date[date] = {'Unique OTUs in OTT': num_otu_in_ott,
                         'Unique OTUs in synthesis': num_otu_in_synth,
                         'Unique OTUs in synthesis from studies': num_phylo_otu_in_synth,
                         'Unique OTUs in studies': num_otu_in_studies,
                         'Unique OTUs in nominated studies': num_otu_in_nominated_studies,
                         'Date has synthesis release': (synth_v and "true" or "false"),
                         'Date has phylesystem info': (phyle_v and "true" or "false"),
                         'OTT version': ott_version,
                         'Date': str(date)}
    # sort by date
    dk = [(datetime.strptime(i, "%Y-%m-%dT%HZ"), i) for i in by_date.keys() if i]
    dk.sort()
    ks = [i[1] for i in dk]
    # create the list of stat objects to return
    stat_list = [by_date[i] for i in ks]
    view_dict['otu_stats'] = stat_list
    view_dict['warnings'] = list(warnings)
    view_dict['warnings'].sort()
    return view_dict

def synthesis_release():
    view_dict = default_view_dict.copy()
    synth = json.loads(fetch_local_synthesis_stats() or '{}')

    if len(synth.keys()) == 0:
        # report this error on the page
        view_dict['release_version'] = 'NO RELEASES FOUND'
        view_dict['synthesis_stats'] = synth
        return view_dict

    # Get date or version from URL, or bounce to the latest release
    #import pdb; pdb.set_trace()
    if len(request.args) == 0:
        release_version = sorted(synth.keys(), reverse=False)[-1]
        redirect(URL('opentree', 'about', 'synthesis_release', 
            vars={}, 
            args=[release_version]))

    view_dict['release_version'] = request.args[0]
    view_dict['synthesis_stats'] = synth
    # TODO: fetch and render Markdown release notes as HTML
    ##view_dict['release_notes'] =

    return view_dict

def taxonomy_release():
    view_dict = default_view_dict.copy()
    fetch_url = 'https://github.com/OpenTreeOfLife/reference-taxonomy/tree/master/doc/{0}.md'

    # fetch and render Markdown release notes as HTML

    #TODO: view_dict['release_notes'] =

    return view_dict

def fetch_local_synthesis_stats():
    try:
        stats = open("applications/%s/static/statistics/synthesis.json" % request.application).read().strip()
        return stats
    except Exception, e:
        return None

def fetch_local_phylesystem_stats():
    try:
        stats = open("applications/%s/static/statistics/phylesystem.json" % request.application).read().strip()
        return stats
    except Exception, e:
        return None

def fetch_local_ott_stats():
    try:
        stats = open("applications/%s/static/statistics/ott.json" % request.application).read().strip()
        return stats
    except:
        return None

def fetch_current_synthesis_source_data():
    try:
        from gluon.tools import fetch
        import simplejson
        method_dict = get_opentree_services_method_urls(request)

        # fetch a list of all studies that contribute to synthesis
        fetch_url = method_dict['getSynthesisSourceList_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "http:%s" % fetch_url
        # as usual, this needs to be a POST (pass empty fetch_args)
        source_list_response = fetch(fetch_url, data='')
        source_list = simplejson.loads( source_list_response )

        # split these source descriptions, which are in the form '{STUDY_ID_PREFIX}_{STUDY_NUMERIC_ID}_{TREE_ID}_{COMMIT_SHA}'
        contributing_study_info = { }   # store (unique) study IDs as keys, commit SHAs as values

        for source_desc in source_list:
            if source_desc == 'taxonomy':
                continue
            source_parts = source_desc.split('_')
            # add default prefix 'pg' to study ID, if not found
            if source_parts[0].isdigit():
                # prepend with default namespace 'pg'
                study_id = 'pg_%s' % source_parts[0]
            else:
                study_id = '_'.join(source_parts[0:2])
            if len(source_parts) == 4:
                tree_id = source_parts[2]
                commit_SHA_in_synthesis = source_parts[3]
            else:
                tree_id = source_parts[1]
                if len(source_parts) == 3:
                    commit_SHA_in_synthesis = source_parts[2]
                else:
                    commit_SHA_in_synthesis = None

            if study_id in contributing_study_info.keys():
                contributing_study_info[ study_id ]['tree_ids'].append( tree_id )
            else:
                contributing_study_info[ study_id ] = {
                    'tree_ids': [ tree_id, ],
                    'commit_SHA_in_synthesis': commit_SHA_in_synthesis
                }


        # fetch the oti metadata (esp. DOI and full reference text) for each
        fetch_url = method_dict['findAllStudies_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "http:%s" % fetch_url

        # as usual, this needs to be a POST (pass empty fetch_args)
        study_metadata_response = fetch(fetch_url, data={"verbose": True}) 
        # TODO: add more friendly label to tree metadata? if so, add "includeTreeMetadata":True above
        study_metadata = simplejson.loads( study_metadata_response )

        # filter just the metadata for studies contributing to synthesis
        contributing_studies = [ ]
        for study in study_metadata:
            # Add any missing study-ID prefixes (assume 'pg') so we can compare
            # with the prefixed IDs provided by getSynthesisSourceList.
            id_parts = study['ot:studyId'].split('_')
            if len(id_parts) == 1:
                prefixed_study_id = 'pg_%s' % study['ot:studyId']
            else:
                prefixed_study_id = study['ot:studyId']
            if prefixed_study_id in contributing_study_info.keys():
                contrib_info = contributing_study_info[ prefixed_study_id ]
                # and commit SHA to support retrieval of *exact* Nexson from synthesis
                study['commit_SHA_in_synthesis'] = contrib_info['commit_SHA_in_synthesis']
                # add contributing tree ID(s) so we can directly link to (or download) them
                study['tree_ids'] = contrib_info['tree_ids']
                contributing_studies.append( study )

        # TODO: sort these alphabetically(?) and render in the page
        ## contributing_studies.sort(key = lambda x: x.get('ot:studyPublicationReference'))
        # NO, apparently they're pre-sorted to reflect the importance of each study

        # TODO: encode data to utf-8?
        ## context_names += [n.encode('utf-8') for n in contextnames_json[gname] ]
        
        # translate data-deposit DOIs/URLs into friendlier forms
        from pprint import pprint
        for study in contributing_studies:
            raw_deposit_doi = study.get('ot:dataDeposit', None)
            if raw_deposit_doi:
                study['friendlyDepositMessage'] = get_data_deposit_message(raw_deposit_doi)
        
        return contributing_studies

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)
