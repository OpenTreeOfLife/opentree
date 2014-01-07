# -*- coding: utf-8 -*-

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

def index():
    # bump to first About page in menu
    redirect(URL('about', 'open-tree-of-life'))

# NOTE that web2py should attempt to convert hyphens (dashes) in URLs into underscores

def open_tree_of_life():
    # URL is /opentree/about/open-tree-of-life
    return dict()

def the_synthetic_tree():
    # URL is /opentree/about/the-synthetic-tree
    return dict()

def the_source_tree_manager():
    # URL is /opentree/about/the-source-tree-manager
    return dict()

def resources():
    return dict()

def credits():
    return dict()
