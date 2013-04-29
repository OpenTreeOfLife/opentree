# -*- coding: utf-8 -*-
### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires
def about():
    return dict()

def index():
    # interpret incoming URL as a tree view, in this format
    #   http://[hostname]/opentree/[{viewer}/]{domSource}@{nodeID}/{taxon name}
    # some valid examples:
    #   http://opentree.com/opentree/argus/ottol@123456/Homo+sapiens
    #   http://opentree.com/opentree/ottol@123456/Homo+sapiens
    #   http://opentree.com/opentree/ottol@123456
    #
    # TODO: add another optional arg 'viewport', like so
    #   http://opentree.com/opentree/argus/0,23,100,400/ottol@123456/Homo+sapiens

    # modify the normal view dictionary to include location+view hints from the URL
    treeview_dict = dict()
    treeview_dict['viewer'] = 'argus'
    treeview_dict['domSource'] = ''
    treeview_dict['nodeID'] = ''
    treeview_dict['nodeName'] = ''
    treeview_dict['viewport'] = ''

    # add a flag to determine whether to force the viewer to this node (vs. using the
    # browser's stored state for this URL, or a default starting node)
    treeview_dict['forcedByURL'] = False

    # handle the first arg (path part) found
    if len(request.args) > 0:
        if request.args[0] in ['argus','onezoom','phylet']:
            treeview_dict['viewer'] = request.args[0]
        elif '@' in request.args[0]:
            treeview_dict['domSource'], treeview_dict['nodeID'] = request.args[0].split('@')

    if len(request.args) > 1:
        if not treeview_dict['nodeID']:
            treeview_dict['domSource'], treeview_dict['nodeID'] = request.args[1].split('@')
        else:
            treeview_dict['nodeName'] = request.args[1]

    if len(request.args) > 2:
        if not treeview_dict['nodeName']:
            treeview_dict['nodeName'] = request.args[2]

    # when all is said and done, do we have enough information to force the location?
    if treeview_dict['domSource'] and treeview_dict['nodeID']:
        treeview_dict['forcedByURL'] = True

    return treeview_dict

def error():
    return dict()

