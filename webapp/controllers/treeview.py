# -*- coding: utf-8 -*-
from opentreewebapputil import get_opentree_services_domains

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires
def index():
    return get_opentree_services_domains(request)


