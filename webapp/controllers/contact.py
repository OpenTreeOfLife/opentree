# -*- coding: utf-8 -*-
from opentreewebapputil import (get_opentree_services_method_urls, 
                                fetch_current_TNRS_context_names)

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

default_view_dict = get_opentree_services_method_urls(request)
default_view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)

def index():
    return default_view_dict

