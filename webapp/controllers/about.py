# -*- coding: utf-8 -*-

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

def index():
    redirect(URL('about', 'open-tree-of-life'))
    #redirect(URL('open_tree_of_life'))
    #redirect('/opentree/about/open_tree_of_life')
    # return dict()
    # failed attempts to use auth.wiki (too hard to wrangle proper URLs)
    # return auth.wiki()
    # return auth.wiki(slug="index")

# NOTE that web2py should attempt to convert hyphens (dashes) in URLs into underscores
def open_tree_of_life():
    # in URL as /opentree/about/open-tree-of-life
    return dict()

