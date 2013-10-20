# -*- coding: utf-8 -*-

#########################################################################
## Manages and manipulates studies in the OToL curation tool
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


@auth.requires_login()
def create():
    return dict(message="study/create")


@auth.requires_login()
def edit():
    #return dict(message="study/edit")
    chosenLayout = request.vars.get('layout', None)  # TOP, LEFT, RIGHT
    if chosenLayout:
        response.view = 'study/edit-%s.html' % chosenLayout  #e eg, 'study/edit-RIGHT.html'
    return dict()


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

