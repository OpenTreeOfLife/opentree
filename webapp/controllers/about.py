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

    # Load each JSON document into a list or dict, so we can compile daily entries. 
    # NB: For simplicity and uniformity, filter these to use only simple dates
    # with no time component!
    # EXAMPLE u'2015-01-16T23Z' ==> u'2015-01-16'
    raw = json.loads(fetch_local_synthesis_stats() or '{}')
    # Pre-sort its raw date strings, so we can discard all the but latest info
    # for each date (e.g. we might toss the morning stats but keep the evening).
    sorted_dates = sorted(raw.keys(), reverse=False)
    synth = {}
    for d in sorted_dates:
        raw_data = raw[d]
        simple_date = _force_to_simple_date_string(d)
        synth[ simple_date ] = raw_data
        # this should overwrite data from earlier in the day

    # phylesystem stats also have mixed date formats
    raw = json.loads(fetch_local_phylesystem_stats() or '{}')
    sorted_dates = sorted(raw.keys(), reverse=False)
    phylesystem = {}
    for d in sorted_dates:
        raw_data = raw[d]
        simple_date = _force_to_simple_date_string(d)
        phylesystem[ simple_date ] = raw_data
        # this should overwrite data from earlier in the day

    # taxonomy stats should always use simple dates
    ott = json.loads(fetch_local_ott_stats() or '[]')

    # create some otu summary stats for each synthesis that we have info about...
    by_date = {}
    warnings = set()
    dates = set(synth.keys() + phylesystem.keys() + [ott_v.get('date') for ott_v in ott])
    # Let's creep tallies up in our fake data, with starting values here
    num_otu_in_ott = 0
    num_otu_in_synth = 0
    num_phylo_otu_in_synth = 0
    num_otu_in_studies = 0
    num_otu_in_nominated_studies = 0

    # Set initial (empty) values for synthesis and phylesystem stats; these will
    # be "carried over" to a subsequent date that has no current data.
    synth_v = {}
    phyle_v = {}

    for date in sorted(dates, reverse=False):
        # carry over latest stats, if none found for this day
        synth_v = synth.get(date, synth_v)
        phyle_v = phylesystem.get(date, phyle_v)

        specified_version = synth_v.get('OTT version')
        if specified_version:
            ott_version_info = get_ott_version_info(specified_version)
            if ott_version_info is None:
                warnings.add('specified version {v} of OTT not found!'.format(v=specified_version))
        else:
            warnings.add('No specified version of OTT for some synthesis releases; guessing OTT versions based on synth-date!')
            ott_version_info =  get_latest_ott_version_info_by_date(date)
            if ott_version_info is None:
                warnings.add('No version of OTT found on-or-before date {d}!'.format(d=date))
        if ott_version_info is None:
            ott_version_info = {}
            warnings.add('OTT version info not found!')
        elif ott is None:
            warnings.add('OTT info not found!')
        else:
            if ott_version_info is None:
                warnings.add('OTT info for version {v} not found!'.format(v=ott_version_info.get('version')))
            else:
                num_otu_in_ott = ott_version_info.get('visible_taxon_count', 0)

        # WAS synth_v.get('Unique OTUs in Synthesis')
        # N.B. Some days (esp. early in history) might not have any synthesis data
        if synth_v:  # ignore empty dict (no data found)
            if synth_v.get('unique_OTU_count') is None:
                warnings.add('"unique_OTU_count" info not found!')
            else:
                num_otu_in_synth = synth_v.get('unique_OTU_count')

            # WAS synth_v.get('Unique OTUs in Synthesis from studies')
            if synth_v.get('total_OTU_count') is None:
                warnings.add('"total_OTU_count" info not found!')
            else:
                num_phylo_otu_in_synth = synth_v.get('total_OTU_count')

        if phyle_v:  # ignore empty dict (no data found)
            # WAS phyle_v.get('Unique OTUs')
            if phyle_v.get('unique_OTU_count') is None:
                warnings.add('phylesystem.unique_OTU_count info not found!')
            else:
                num_otu_in_studies = phyle_v.get('unique_OTU_count')

            # WAS synth_v.get('Unique OTUs in nominated studies')
            if phyle_v.get('nominated_study_unique_OTU_count') is None:
                warnings.add('phylesystem.nominated_study_unique_OTU_count info not found!')
            else:
                num_otu_in_nominated_studies = phyle_v.get('nominated_study_unique_OTU_count')

        #import pdb; pdb.set_trace()
        #print( date, ott_version_info['date'], (ott_version_info['date'] == date and "true" or "false") )
        #print( date, (synth.get(date, None) and "true" or "false") )
        by_date[date] = {'Unique OTUs in OTT': num_otu_in_ott,
                         'Unique OTUs in synthesis': num_otu_in_synth,
                         'Unique OTUs in synthesis from studies': num_phylo_otu_in_synth,
                         'Unique OTUs in studies': num_otu_in_studies,
                         'Unique OTUs in nominated studies': num_otu_in_nominated_studies,
                         # TODO: Add pre-calculated stats where provided?
                         'Date has synthesis release': (synth.get(date, None) and "true" or "false"),
                         'Date has taxonomy version': (ott_version_info['date'] == date and "true" or "false"),
                         'Date has phylesystem info': (phylesystem.get(date, None) and "true" or "false"),
                         'OTT version': ott_version_info.get('version').encode("utf8"),
                         'Date': str(date)}
    # sort by date (allowing for different date formats)
    #dk = [(datetime.strptime(i, "%Y-%m-%d"), i) for i in by_date.keys() if i]
    dk = []
    for i in by_date.keys():
        if i:
            # remove any time (intra-day) component for uniform dates!
            # EXAMPLE u'2015-01-16T23Z' ==> u'2015-01-16'
            i = i.split('T')[0]
            converted_date = datetime.strptime(i, "%Y-%m-%d")
            dk.append((converted_date, i,))
    dk.sort()
    ks = [i[1] for i in dk]
    # create the list of stat objects to return
    stat_list = [by_date[i] for i in ks]
    view_dict['otu_stats'] = stat_list
    view_dict['warnings'] = list(warnings)
    view_dict['warnings'].sort()
    return view_dict

def _force_to_simple_date_string( date_string ):
    # remove any time (intra-day) component for uniform dates!
    # EXAMPLE u'2015-01-16T23Z' ==> u'2015-01-16'
    return date_string.split('T')[0]

def synthesis_release():
    view_dict = default_view_dict.copy()

    # Load each JSON document into a list or dict, so we can compile daily entries. 
    # NB: For simplicity and uniformity, filter these to use only simple dates
    # with no time component!
    # EXAMPLE u'2015-01-16T23Z' ==> u'2015-01-16'
    raw = json.loads(fetch_local_synthesis_stats() or '{}')
    # Pre-sort its raw date strings, so we can discard all the but latest info
    # for each date (e.g. we might toss the morning stats but keep the evening).
    sorted_dates = sorted(raw.keys(), reverse=False)
    synth = {}
    for d in sorted_dates:
        raw_data = raw[d]
        simple_date = _force_to_simple_date_string(d)
        synth[ simple_date ] = raw_data
        # this should overwrite data from earlier in the day

    if len(synth.keys()) == 0:
        # report this error on the page
        view_dict['release_version'] = 'NO RELEASES FOUND'
        view_dict['synthesis_stats'] = synth
        return view_dict

    # Get date or version from URL, or bounce to the latest release by default
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

def taxonomy_version():
    view_dict = default_view_dict.copy()

    # load taxonomy-version history and basic stats
    ott = json.loads(fetch_local_ott_stats() or '[]')
    if len(ott) == 0:
        # report this error on the page
        view_dict['taxonomy_version'] = 'NO VERSIONS FOUND'
        view_dict['taxonomy_stats'] = ott
        return view_dict

    # Get OTT version from URL, or bounce to the latest version by default
    if len(request.args) == 0:
        taxonomy_version = sorted([v.get('version') for v in ott], reverse=False)[-1]
        redirect(URL('opentree', 'about', 'taxonomy_version', 
            vars={}, 
            args=[taxonomy_version]))

    view_dict['taxonomy_version'] = request.args[0]
    view_dict['taxonomy_stats'] = ott

    # fetch and render Markdown release notes as HTML
    from gluon.tools import fetch
    from gluon.contrib.markdown.markdown2 import markdown
    from urllib2 import HTTPError
    import re
    # Cook up some reasonably strong regular expressions to detect bare
    # URLs and wrap them in hyperlinks. Adapted from
    # http://stackoverflow.com/questions/1071191/detect-urls-in-a-string-and-wrap-with-a-href-tag
    link_regex = re.compile(  r'''
                         (?x)( # verbose identify URLs within text
                  (http|https) # make sure we find a resource type
                           :// # ...needs to be followed by colon-slash-slash
                (\w+[:.]?){2,} # at least two domain groups, e.g. (gnosis.)(cx)
                          (/?| # could be just the domain name (maybe w/ slash)
                    [^ \n\r"]+ # or stuff then space, newline, tab, quote
                        [\w/]) # resource name ends in alphanumeric or slash
         (?=([\s\.,>)'"\]]|$)) # assert: followed by white or clause ending OR end of line
                             ) # end of match group
                               ''')
    # link_replace = r'<a href="\1" />\1</a>'
    # let's try this do-nothing version
    link_replace = r'\1'
    # NOTE the funky constructor required to use this below

    fetch_url = 'https://raw.githubusercontent.com/OpenTreeOfLife/reference-taxonomy/master/doc/{v}.md'.format(v=request.args[0])
    try:
        version_notes_response = fetch(fetch_url)
        version_notes_html = markdown(version_notes_response, 
                                      extras={'link-patterns':None}, 
                                      link_patterns=[(link_regex, link_replace)]
                                      ).encode('utf-8')
    except HTTPError:
        version_notes_html = None
    view_dict['taxonomy_version_notes'] = version_notes_html

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

_sorted_ott_versions = None
def get_sorted_ott_versions():
    global _sorted_ott_versions
    if not _sorted_ott_versions:
        _sorted_ott_versions = json.loads(fetch_local_ott_stats() or '[]')
        # make sure these are sorted by date (chronological order)
        _sorted_ott_versions.sort(key = lambda x: x.get('date'))
    return _sorted_ott_versions

def get_ott_version_info(specified_version):
    for version in get_sorted_ott_versions():
        if version.get('version') == specified_version:
            return version

def get_latest_ott_version_info_by_date(date):
    closest_previous_version = None
    for version in get_sorted_ott_versions():
        try:
            #v_date = datetime.strptime(version.get('date'), "%Y-%m-%dT%HZ")
            v_date = version.get('date')
        except:
            raise Exception('Missing OTT version date')
        if v_date <= date:
            closest_previous_version = version
    if closest_previous_version is None:
        raise Exception('No OTT version before this date: %s' % date)
    return closest_previous_version

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

        # sort these alphabetically by first author, then render in the page
        contributing_studies.sort(key = lambda x: x.get('ot:studyPublicationReference'))

        # TODO: encode data to utf-8?
        ## context_names += [n.encode('utf-8') for n in contextnames_json[gname] ]
        
        # translate data-deposit DOIs/URLs into friendlier forms
        for study in contributing_studies:
            raw_deposit_doi = study.get('ot:dataDeposit', None)
            if raw_deposit_doi:
                study['friendlyDepositMessage'] = get_data_deposit_message(raw_deposit_doi)
        
        return contributing_studies

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)
