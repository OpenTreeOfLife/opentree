from pyramid.view import view_config
from synthetic_tree_viewer.opentreewebapputil import (
    get_user_display_name,
    get_conf,
    get_conf_as_dict,
    get_domain_banner_text,
    get_domain_banner_hovertext,
    get_currently_deployed_opentree_branch,
    get_opentree_services_method_urls,
    latest_CrossRef_URL,
    fetch_current_TNRS_context_names,
    get_data_deposit_message,
    )
from pyramid.httpexceptions import (
    HTTPNotFound,
    HTTPSeeOther,
    )
from urllib.parse import quote

def _minimal_about_viewdict(request):
    # First, copy our boilerplate config vars (getDraftTreeID_url, etc)
    view_dict = get_opentree_services_method_urls(request)

    # Then add/override with these explicit key-value pairs
    view_dict.update({
        # NB - Duplicate keys will be resolved in favor of the values below!
        'conf': get_conf(request),  # needed for the footer diagnostics
        'response': request.response,
        'registry': request.registry,
        'taxonSearchContextNames': fetch_current_TNRS_context_names(request),
        'domain_banner_text': get_domain_banner_text(request),
        'domain_banner_hovertext': get_domain_banner_hovertext(request),
        })

    if request.params.get('parentWindowURL', None):
        plain_feedback_url = unquote_plus(request.params.get('parentWindowURL'))
        view_dict['feedbackParentWindowURL'] = plain_feedback_url
    else:
        view_dict['feedbackParentWindowURL'] = None

    return view_dict


@view_config(route_name='about',
             renderer='synthetic_tree_viewer:templates/about/open_tree_of_life.jinja2')
def about_default_redirect(request):
    raise HTTPSeeOther(location='/about/open-tree-of-life')

@view_config(route_name='about_open_tree_of_life',
             renderer='synthetic_tree_viewer:templates/about/open_tree_of_life.jinja2')
@view_config(route_name='about_privacy_policy',
             renderer='synthetic_tree_viewer:templates/about/privacy_policy.jinja2')
@view_config(route_name='about_licenses',
             renderer='synthetic_tree_viewer:templates/about/licenses.jinja2')
@view_config(route_name='about_developer_resources',
             renderer='synthetic_tree_viewer:templates/about/developer_resources.jinja2')
def about_misc(request):
    # provide view context for a dumb template
    view_dict = _minimal_about_viewdict(request)
    return view_dict

@view_config(route_name='about_references',
             renderer='synthetic_tree_viewer:templates/about/references.jinja2')
def about_bibliographic_references(request):
    view_dict = _minimal_about_viewdict(request)
    view_dict['contributing_studies'] = fetch_current_synthesis_source_data(request)
    view_dict['latest_CrossRef_URL'] = latest_CrossRef_URL
    view_dict['url_quote'] = quote
    return view_dict

def fetch_current_synthesis_source_data(request):
    json_headers = {
        'content-type' : 'application/json',
        'accept' : 'application/json',
    }
    try:
        import requests
        import json
        method_dict = get_opentree_services_method_urls(request)

        # fetch a list of all studies that contribute to synthesis
        fetch_url = method_dict['getSynthesisSourceList_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url
        # as usual, this needs to be a POST (pass empty fetch_args)
        source_list_response = requests.post(fetch_url, data=json.dumps({'include_source_list':True}), headers=json_headers)
        source_data = source_list_response.json()
        source_id_list = source_data.get('source_list', [ ])
        source_id_map = source_data.get('source_id_map')
        # split these source descriptions, which are in the form '{STUDY_ID_PREFIX}_{STUDY_NUMERIC_ID}_{TREE_ID}_{COMMIT_SHA}'
        contributing_study_info = { }   # store (unique) study IDs as keys, commit SHAs as values

        for source_id in source_id_list:
            source_details = source_id_map.get( source_id )
            if 'taxonomy' in source_details:
                continue
            study_id = source_details.get('study_id')
            # N.B. assume that all study IDs have a two-letter prefix!
            tree_id = source_details.get('tree_id')
            commit_SHA_in_synthesis = source_details.get('git_sha')
            # N.B. assume that any listed study has been used!

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
            fetch_url = "https:%s" % fetch_url

        # as usual, this needs to be a POST (pass empty fetch_args)
        study_metadata_response = requests.post(fetch_url, data=json.dumps({"verbose": True}), headers=json_headers)
        # TODO: add more friendly label to tree metadata? if so, add "includeTreeMetadata":True above
        study_metadata = study_metadata_response.json()

        # filter just the metadata for studies contributing to synthesis
        contributing_studies = [ ]
        for study in study_metadata['matched_studies']:
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

    except Exception as e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e)
