# -*- coding: utf-8 -*-

#########################################################################
## Basic support for a batch name-resolution tool (web app)
## - index()    shows a simple tool (single-page app)
#########################################################################

from applications.opentree.modules.opentreewebapputil import(
    get_opentree_services_method_urls, 
    fetch_current_TNRS_context_names,
    get_maintenance_info)

# N.B. This module is shared with tree-browser app, which is aliased as
# 'opentree'. Any name changes will be needed here as well!

def index():
    """
    Offer creation (or uploading) of a name-mapping dataset
    """

    response.view = 'tnrs.html'
    view_dict = get_opentree_services_method_urls(request)
    #view_dict['message'] = "This would appear at bottom of page.."
    view_dict['maintenance_info'] = get_maintenance_info(request)
    view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    return view_dict

