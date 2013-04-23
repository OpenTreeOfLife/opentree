# -*- coding: utf-8 -*-
from opentreewebapputil import get_opentree_services_domains

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires
def index():
    context_dict = get_opentree_services_domains(request)
    context_dict['tree_id'] = request.vars.get('tree')
    context_dict['node_id'] = request.vars.get('node')
    return context_dict

