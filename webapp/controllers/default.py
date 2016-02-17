# -*- coding: utf-8 -*-
import urllib2
from opentreewebapputil import (get_opentree_services_method_urls, 
                                fetch_current_TNRS_context_names)

default_view_dict = get_opentree_services_method_urls(request)
default_view_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)

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
    treeview_dict = default_view_dict.copy()
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
        else:
            # first arg is neither a viewer nor a proper node, which is a Bad Thing
            raise HTTP(404)

    if len(request.args) > 1:
        if not treeview_dict['nodeID']:
        #if (not treeview_dict['nodeID']) and '@' in request.args[1]:
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
    treeview_dict['draftTreeName'], treeview_dict['startingNodeID'] = fetch_current_synthetic_tree_ids()
    treeview_dict['taxonSearchContextNames'] = fetch_current_TNRS_context_names(request)
    return treeview_dict

def error():
    return dict()

def download_subtree():
    id_type = request.args(0)  # 'ottol-id' or 'node-id'
    node_or_ottol_id = request.args(1)
    node_name = request.args(2)
    import cStringIO
    import contenttype as c
    s=cStringIO.StringIO()
     
    try:
        # fetch the Newick tree as JSON from remote site
        from gluon.tools import fetch
        import simplejson

        method_dict = get_opentree_services_method_urls(request)

        # use the appropriate web service for this ID type
        fetch_url = method_dict['getDraftSubtree_url']
        if id_type == 'ottol-id':
            fetch_args = {'ott_id': node_or_ottol_id}
        else:
            fetch_args = {'node_id': node_or_ottol_id}
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url

        # apparently this needs to be a POST, or it just describes the API
        tree_response = fetch(fetch_url, data=fetch_args)
        tree_json = simplejson.loads( tree_response )
        newick_text = str(tree_json.get('newick', 'NEWICK_NOT_FOUND')).encode('utf-8');
        s.write( newick_text )

    except Exception, e:
        # throw 403 or 500 or just leave it
        if id_type == 'ottol-id':
            s.write( u'ERROR - Unable to fetch the Newick subtree for ottol id "%s" (%s):\n\n%s' % (node_or_ottol_id, node_name, newick_text) )
        else:
            s.write( u'ERROR - Unable to fetch the Newick subtree for node id "%s" (%s):\n\n%s' % (node_or_ottol_id, node_name, newick_text) )

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
        import simplejson

        method_dict = get_opentree_services_method_urls(request)
        fetch_url = method_dict['getDraftTreeID_url']
        if fetch_url.startswith('//'):
            # Prepend scheme to a scheme-relative URL
            fetch_url = "https:%s" % fetch_url

        fetch_args = {}
        # this needs to be a POST (pass fetch_args or ''); if GET, it just describes the API
        # N.B. that gluon.tools.fetch() can't be used here, since it won't send "raw" JSON data as treemachine expects
        req = urllib2.Request(url=fetch_url, data=simplejson.dumps(fetch_args), headers={"Content-Type": "application/json"}) 
        ids_response = urllib2.urlopen(req).read()

        ids_json = simplejson.loads( ids_response )
        draftTreeName = str(ids_json['synth_id']).encode('utf-8')
        startNodeID = str(ids_json['root_node_id']).encode('utf-8')
        return (draftTreeName, startNodeID)

    except Exception, e:
        # throw 403 or 500 or just leave it
        return ('ERROR', e.message)

# provide support for phylopic searches and image display via HTTPS
def phylopic_proxy():
    phylopic_url = request.env.web2py_original_uri.split('phylopic_proxy')[1]
    # prepend the real domain, using HTTP, and return the response
    phylopic_url = 'http://phylopic.org/%s' % phylopic_url
    try:
        req = urllib2.Request(url=phylopic_url) 
        resp = urllib2.urlopen(req).read()
        return resp
    except:
        raise HTTP(503, 'The attempt to fetch an image from phylopic failed')

