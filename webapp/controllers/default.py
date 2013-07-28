# -*- coding: utf-8 -*-
from opentreewebapputil import get_opentree_services_domains
from opentreewebapputil import get_opentree_services_method_urls

### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

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
    treeview_dict = get_opentree_services_method_urls(request)
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

    # retrieve latest synthetic-tree ID (and its 'life' node ID)
    # TODO: Only refresh this periodically? Or only when needed for initial destination?
    treeview_dict['draftTreeName'], treeview_dict['lifeNodeID'] = fetch_current_synthetic_tree_ids()
    treeview_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names()

    return treeview_dict

def error():
    return dict()

def download_subtree():
    id_type = request.args(0)  # 'ottol-id' or 'node-id'
    node_or_ottol_id = request.args(1)
    max_depth = request.args(2)
    node_name = request.args(3)
    import cStringIO
    import contenttype as c
    s=cStringIO.StringIO()
     
    try:
        # fetch the Newick tree as JSON from remote site
        from gluon.tools import fetch
        import simplejson

        method_dict = get_opentree_services_method_urls(request)

        # use the appropriate web service for this ID type
        if id_type == 'ottol-id':
            fetch_url = method_dict['getDraftTreeForOttolID_url']
            fetch_args = {'ottolID': node_or_ottol_id, 'maxDepth': max_depth}
        else:
            fetch_url = method_dict['getDraftTreeForNodeID_url']
            fetch_args = {'nodeID': node_or_ottol_id, 'maxDepth': max_depth}

        # apparently this needs to be a POST, or it just describes the API
        tree_response = fetch(fetch_url, data=fetch_args)
        tree_json = simplejson.loads( tree_response )
        newick_text = tree_json['tree'].encode('utf-8');
        s.write( newick_text )

    except Exception, e:
        # throw 403 or 500 or just leave it
        if id_type == 'ottol-id':
            s.write( u'ERROR - Unable to fetch the Newick subtree for ottol id "%s" (%s) with max depth %s:\n\n%s' % (node_or_ottol_id, node_name, max_depth, newick_text) )
        else:
            s.write( u'ERROR - Unable to fetch the Newick subtree for node id "%s" (%s) with max depth %s:\n\n%s' % (node_or_ottol_id, node_name, max_depth, newick_text) )

    finally:
        response.headers['Content-Type'] = 'text/plain'
        if id_type == 'ottol-id':
            response.headers['Content-Disposition'] = "attachment; filename=subtree-ottol-%s-%s.txt" % (node_or_ottol_id, node_name)
        else:
            response.headers['Content-Disposition'] = "attachment; filename=subtree-node-%s-%s.txt" % (node_or_ottol_id, node_name)
        return s.getvalue()

def fetch_current_synthetic_tree_ids():
    try:
        # fetch the latest IDs as JSON from remote site
        from gluon.tools import fetch
        import simplejson

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getDraftTreeID_url']
        # this needs to be a POST (pass empty fetch_args); if GET, it just describes the API
        ids_response = fetch(fetch_url, data='')

        ids_json = simplejson.loads( ids_response )
        draftTreeName = ids_json['draftTreeName'].encode('utf-8')
        lifeNodeID = ids_json['lifeNodeID'].encode('utf-8')
        return (draftTreeName, lifeNodeID)

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)

def fetch_current_TNRS_context_names():
    try:
        # fetch the latest contextName values as JSON from remote site
        from gluon.tools import fetch
        import simplejson

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getContextsJSON_url']
        # as usual, this needs to be a POST (pass empty fetch_args)
        contextnames_response = fetch(fetch_url, data='')

        contextnames_json = simplejson.loads( contextnames_response )
        # start with LIFE group (incl. 'All life'), and add any other ordered suggestions
        ordered_group_names = unique_ordered_list(['LIFE','PLANTS','ANIMALS'] + [g for g in contextnames_json])
        context_names = [ ]
        for gname in ordered_group_names:
            # allow for eventual removal or renaming of expected groups
            if gname in contextnames_json:
                context_names += [n.encode('utf-8') for n in contextnames_json[gname] ]

        # draftTreeName = ids_json['draftTreeName'].encode('utf-8')
        return (context_names)

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)

def unique_ordered_list(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if x not in seen and not seen_add(x)]
