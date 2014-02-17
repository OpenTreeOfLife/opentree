#!/usr/bin/env python
import xml.etree.ElementTree as ET
import xml.dom.minidom
import codecs
import json

def _gen_bf_el(x):
    '''
    Builds a dictionary from the ElementTree element x
    The function
    Uses as hacky splitting of attribute or tag names using {}
        to remove namespaces.
    returns a pair of: the tag of `x` and the badgerfish
        representation of the subelements of x
    '''
    obj = {}
    # grab the tag of x
    el_name = x.nodeName
    assert el_name is not None
    # add the attributes to the dictionary
    att_container = x.attributes
    ns_obj = {}
    for i in xrange(att_container.length):
        attr = att_container.item(i)
        n = attr.name
        t = None
        if n.startswith('xmlns'):
            if n == 'xmlns':
                t = '$'
            elif n.startswith('xmlns:'):
                t = n[6:] # strip off the xmlns:
        if t is None:
            obj['@' + n] = attr.value
        else:
            ns_obj[t] = attr.value
    if ns_obj:
        obj['@xmlns'] = ns_obj

    tl = []
    ntl = []
    x.normalize()
    # store the text content of the element under the key '$'
    for c in x.childNodes:
        if c.nodeType == xml.dom.minidom.Node.TEXT_NODE:
            tl.append(c)
        else:
            ntl.append(c)
    try:
        tl = [i.data for i in tl]
        text_content = ''.join(tl)
    except:
        text_content = ''
    if text_content:
        obj['$'] = text_content
    # accumulate a list of the children names in ko, and 
    #   the a dictionary of tag to xml elements.
    # repetition of a tag means that it will map to a list of
    #   xml elements
    cd = {}
    ko = []
    ks = set()
    for child in ntl:
        k = child.nodeName
        if k not in ks:
            ko.append(k)
            ks.add(k)
        p = cd.get(k)
        if p is None:
            cd[k] = child
        elif isinstance(p, list):
            p.append(child)
        else:
            cd[k] = [p, child]
    # Converts the child XML elements to dicts by recursion and
    #   adds these to the dict.
    for k in ko:
        v = cd[k]
        if isinstance(v, list):
            dcl = []
            ct = None
            for xc in v:
                ct, dc = _gen_bf_el(xc)
                dcl.append(dc)
        else:
            ct, dcl = _gen_bf_el(v)
        # this assertion will trip is the hacky stripping of namespaces
        #   results in a name clash among the tags of the children
        assert ct not in obj
        obj[ct] = dcl
    return el_name, obj

def to_badgerfish_dict(src, encoding=u'utf8'):
    '''Takes either:
            (1) a file_object, or
            (2) (if file_object is None) a filepath and encoding
    Returns a dictionary with the keys/values encoded according to the badgerfish convention
    See http://badgerfish.ning.com/

    Caveats/bugs:
        
    '''
    if isinstance(src, str):
        src = codecs.open(src, 'rU', encoding=encoding)
    doc = xml.dom.minidom.parse(src)
    root = doc.documentElement
    key, val = _gen_bf_el(root)
    return {key: val}

def _add_child_list_to_ET_subtree(parent, child_list, key, key_order):
    if not isinstance(child_list, list):
        child_list = [child_list]
    for child in child_list:
        ca, cd, cc = _break_keys_by_bf_type(child)
        cel = ET.SubElement(parent, key, attrib=ca)
        if cd:
            cel.text = cd
        _add_ET_subtree(cel, cc, key_order)

def _add_ET_subtree(parent, children_dict, key_order=None):
    written = set()
    if key_order:
        for t in key_order:
            k, next_order_el = t
            assert(next_order_el is None or isinstance(next_order_el, tuple))
            if k in children_dict:
                child_list = children_dict[k]
                written.add(k)
                _add_child_list_to_ET_subtree(parent, child_list, k, next_order_el)
    ksl = children_dict.keys()
    ksl.sort()
    for k in ksl:
        child_list = children_dict[k]
        if k not in written:
            _add_child_list_to_ET_subtree(parent, child_list, k, None)


def _break_keys_by_bf_type(o):
    '''Breaks o into a triple two dicts and text data by key type:
        attrib keys (start with '@'),
        text (value associated with the '$' or None),
        child element keys (all others)
    '''
    ak = {}
    tk = None
    ck = {}
    for k, v in o.items():
        if k.startswith('@'):
            if k == '@xmlns':
                ak['xmlns'] = v['$']
                for nsk, nsv in v.items():
                    if nsk != '$':
                        ak['xmlns:' + nsk] = nsv
            else:
                s = k[1:]
                ak[s] = v
        elif k == '$':
            tk = v
        else:
            ck[k] = v
    return ak, tk, ck


def bf2ET(obj_dict, key_order=None):
    '''Converts a dict-like object that obeys the badgerfish conventions
    to an ElementTree.Element that represents the data in a subtree of
    XML tree.
    '''
    base_keys = obj_dict.keys()
    assert(len(base_keys) == 1)
    root_name = base_keys[0]
    root_obj = obj_dict[root_name]
    atts, data, children = _break_keys_by_bf_type(root_obj)
    #attrib_dict = _xml_attrib_for_bf_obj(root_obj)
    r = ET.Element(root_name, attrib=atts)
    if data:
        r.text = data
    _add_ET_subtree(r, children, key_order)
    return r

def write_obj_as_xml(obj_dict, file_obj):
    r = bf2ET(obj_dict)
    ET.ElementTree(r).write(file_obj,
                            encoding='utf-8')
    file_obj.write(u'\n')

def cull_for_ot_nexson(o, data_deposit=None):
    '''Removes the elements that are not used by Open Tree (e.g. characters block)
    '''
    n = None
    for i in [u'nex:nexml', u'nexml']:
        if i in o:
            n = o[i]
            break
    if n is None:
        return
    try:
        del n['characters']
    except:
        pass
    if data_deposit:
        m = n.setdefault('meta', [])
        if not isinstance(m, list):
            m = [m]
            n['meta'] = m
        m.append({"@href": data_deposit,
                  "@property": "ot:dataDeposit", 
                  "@xsi:type": "nex:ResourceMeta"})

def get_ot_study_info_from_nexml(src, encoding=u'utf8'):
    '''Converts an XML doc to JSON using the badgerfish convention (see to_badgerfish_dict)
    and then prunes elements not used by open tree of life study curartion.

    Currently:
        removes nexml/characters @TODO: should replace it with a URI for 
            where the removed character data can be found.
    '''
    o = to_badgerfish_dict(src)
    try:
        pass # del o['nexml']['characters']
    except:
        pass
    return o

def get_ot_study_info_from_treebase_nexml(src, encoding=u'utf8'):
    '''Just a stub at this point. Intended to normalize treebase-specific metadata 
    into the locations where open tree of life software that expects it. 

    `src` can be a string (filepath) or a input file object.
    @TODO: need to investigate which metadata should move or be copied
    '''
    o = get_ot_study_info_from_nexml(src, encoding=encoding)
    return o


def nexobj2ET(obj_dict):
    base_keys = obj_dict.keys()
    assert(len(base_keys) == 1)
    root_name = base_keys[0]
    root_obj = obj_dict[root_name]
    atts, data, children = _break_keys_by_bf_type(root_obj)
    atts['generator'] = 'org.opentreeoflife.api.nexonvalidator.json2xml'
    if not 'version' in atts:
        atts['version'] = '0.9'
    #attrib_dict = _xml_attrib_for_bf_obj(root_obj)
    r = ET.Element(root_name, attrib=atts)
    if data:
        r.text = data
    nexml_key_order = (('meta', None),
                       ('otus', (('meta', None),
                                 ('otu', None)
                                )
                       ),
                       ('characters', (('meta', None),
                                       ('format',(('meta', None),
                                                  ('states', (('state', None),
                                                              ('uncertain_state_set', None),
                                                             )
                                                  ),
                                                  ('char', None)
                                                 ),
                                       ),
                                       ('matrix', (('meta', None),
                                                   ('row', None),
                                                  )
                                       ),
                                      ),
                       ),
                       ('trees', (('meta', None),
                                  ('tree', (('meta', None),
                                            ('node', None),
                                            ('edge', None)
                                           )
                                  )
                                 )
                       )
                      )
    _add_ET_subtree(r, children, nexml_key_order)
    return r

def write_obj_as_nexml(obj_dict, file_obj):
    r = nexobj2ET(obj_dict)
    ET.ElementTree(r).write(file_obj,
                            encoding='utf-8')
    file_obj.write(u'\n')
    
if __name__ == '__main__':
    import sys
    mode_list = ['xj', 'jx', 'nj', 'jn']
    try:
        mode = sys.argv[1].lower()
        assert(mode in mode_list)
    except:
        opts = '", "'.join(mode_list)
        msg = 'Expecing the first argument to be one of:\n "{o}"'.format(o=opts)
        sys.exit(msg)
    try:
        inp = sys.argv[2]
    except:
        inp = sys.stdin
    out = codecs.getwriter('utf-8')(sys.stdout)
    
    if mode in ['xj', 'nj']:
        if mode == 'xj':
            o = to_badgerfish_dict(inp)
        else:
            o = get_ot_study_info_from_nexml(inp)
        json.dump(o, out, indent=0, sort_keys=True)
        out.write('\n')
    elif mode in ['jx', 'jn']:
        o = json.load(codecs.open(inp, 'rU', 'utf-8'))
        if mode == 'jx':
            write_obj_as_xml(o, out)
        else:
            write_obj_as_nexml(o, out)
        
