#!/usr/bin/env python
import sys
DEBUGGING = False
def warn(m):
    try:
        sys.stderr.write('WARNING: %s\n' % m)
    except:
        pass

def debug(m):
    if DEBUGGING:
        try:
            sys.stderr.write("DEBUG: %s\n" % m)
        except:
            pass

def _get_ottol_id_from_meta_dict(m):
    if m.get('@property') == 'ot:ottolid':
        return m.get('$')
    return None

def _get_original_name_from_meta_dict(m):
    if m.get('@property') == 'ot:originalLabel':
        return m.get('$')
    return None

def _get_el_from_meta_from_meta_dict(m, k, t):
    if m.get('@property') == k:
        if m.get("@xsi:type") != t:
            warn('found property "%s", but it was not of xsi:type "%s"' % (k, t))
            return None
        return m.get('$')
    return None


def _get_type_of_meta_from_list_or_dict(m, fn):
    if isinstance(m, dict):
        return fn(m)
    assert isinstance(m, list)
    for m_element in m:
        i = fn(m_element)
        if i is not None:
            return i
    return None


def _get_meta_el_from_list_or_dict(m, k, t, fn):
    if isinstance(m, dict):
        return fn(m, k, t)
    assert isinstance(m, list)
    for m_element in m:
        i = fn(m_element, k, t)
        if i is not None:
            return i
    return None


def get_ottol_id_from_meta(m):
    """Returns the OTT id from a meta element or a list of meta elements or None.
    """
    return _get_type_of_meta_from_list_or_dict(m, _get_ottol_id_from_meta_dict)

def get_original_name_from_meta(m):
    """Returns the OTT id from a meta element or a list of meta elements or None.
    """
    return _get_type_of_meta_from_list_or_dict(m, _get_original_name_from_meta_dict)

def get_literal_from_meta(m, k):
    """Returns the LiteralMeta with property name of k from a meta element or a list of meta elements or None.
    """
    return _get_meta_el_from_list_or_dict(m, k, "nex:LiteralMeta", _get_el_from_meta_from_meta_dict)

def get_resource_from_meta(m, k):
    """Returns the ResourceMeta with property name of k from a meta element or a list of meta elements or None.
    """
    return _get_meta_el_from_list_or_dict(m, k, "nex:ResourceMeta", _get_el_from_meta_from_meta_dict)

class OTUList(list):
    def __init__(self, o):
        list.__init__(self, [])
        self.nexsonid = o['@id']
        for s in o.get('otu', []):
            self.append(OTU(s))

class TreeList(list):
    def __init__(self, o, otu_list, oid2o):
        list.__init__(self, [])
        self.nexsonid = o['@id']
        o_list_id = o['@otus']
        assert o_list_id == otu_list.nexsonid
        for s in o.get('tree', []):
            self.append(Tree(s, oid2o))

class OTU(object):
    def __init__(self, o):
        m = o['meta']
        self.nexsonid = o['@id']
        self.normalized_label = o['@label']
        if m:
            self.original_label = get_original_name_from_meta(m)
            self.ott_id = get_ottol_id_from_meta(m)
        self.raw = dict(o)
        self._as_core_dict = None
    def as_core_dict(self):
        if self._as_core_dict is None:
            d = {
                'nexsonid': self.nexsonid,
                'normalized_label': self.normalized_label,
                'original_label': self.original_label,
                'ott_id': self.ott_id
            }
            self._as_core_dict = d
        return self._as_core_dict

class Node(object):
    def __init__(self, d, oid2o):
        self.nexsonid = d['@id']
        self.is_root = d.get('@root', 'false').lower() == 'true'
        oid = d.get('@otu')
        if oid is None:
            self.otu = None
        else:
            self.otu = oid2o[oid]
        self.out_edges = []
        self.to_parent_edge = None

class Edge(object):
    def __init__(self, d, nid2n):
        self.nexsonid = d['@id']
        sid = d['@source']
        self.parent = nid2n[sid]
        did = d['@target']
        self.child = nid2n[did]
        self.parent.out_edges.append(self)
        assert self.child.to_parent_edge is None
        self.child.to_parent_edge = self
        

class Tree(object):
    def __init__(self, d, oid2o):
        self.nexsonid = d['@id']
        self._node_list = []
        self.node_id_2_node = {}
        self.ottid_to_node_list = {}
        for nd in d['node']:
            node = Node(nd, oid2o)
            self._node_list.append(node)
            assert node.nexsonid not in self.node_id_2_node
            self.node_id_2_node[node.nexsonid] = node
            if not node.out_edges:
                o = node.otu
                if o is None:
                    k = None
                else:
                    k = o.ott_id
                self.ottid_to_node_list.setdefault(k, []).append(node)
        self._edge_list = []
        self.edge_id_2_edge = {}
        for nd in d['edge']:
            edge = Edge(nd, self.node_id_2_node)
            self._edge_list.append(edge)
            assert edge.nexsonid not in self.edge_id_2_edge
            self.edge_id_2_edge[edge.nexsonid] = edge

class Study(object):
    literal_m_list = ['studyPublicationReference', 'curatorName', 'studyId', 'studyYear', 'focalClade']
    resource_m_list = ['dataDeposit', 'studyPublication']
    def __init__(self, nexson_obj):
        c = nexson_obj['nexml']
        self.otu_list = OTUList(c['otus'])
        self.otu_nexsonid_to_otu = {}
        for o in self.otu_list:
            assert o.nexsonid not in self.otu_nexsonid_to_otu
            self.otu_nexsonid_to_otu[o.nexsonid] = o
        self.tree_list = TreeList(c['trees'], self.otu_list, self.otu_nexsonid_to_otu)
        self.tree_nexsonid_to_tree = {}
        for tree in self.tree_list:
            if tree.nexsonid.startswith('tree'):
                tid = tree.nexsonid[4:]
            else:
                tid = tree.nexsonid
            self.tree_nexsonid_to_tree[tid] = tree
        m = c['meta']
        self.meta = {}
        for k in Study.literal_m_list:
            self.meta[k] = get_literal_from_meta(m, 'ot:' + k)
        for k in Study.resource_m_list:
            self.meta[k] = get_resource_from_meta(m, 'ot:' + k)
        for obj in m:
            k = obj.get('@property', '')
            if k.startswith('ot:'):
                k = k[3:]
            if k == 'tag':
                self.meta.setdefault('tag', []).append(get_literal_from_meta(obj, 'ot:' + k))
            elif k and (k not in Study.resource_m_list) and (k not in Study.literal_m_list):
                warn('Unknown meta property %s' % obj.get('@property'))
        self.raw = {}
        for k, v in nexson_obj.iteritems():
            if k not in ['trees', 'otus']:
                self.raw[k] = v
    def node_for_nexsonid(self, nid):
        for t in self.tree_list:
            n = t.node_id_2_node.get(nid)
            if n:
                return n
        return None

if __name__ == '__main__':
    import json
    o = json.load(open(sys.argv[1], 'rU'))
    Study(o)
