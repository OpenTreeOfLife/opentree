#!/usr/bin/env python
#__all__ =['process_treemachine_log',
#          'refresh_html',
#          'refresh_ingest',
#          'refresh_nexsons'
#         ]

import os, sys, subprocess, json
import requests
import gzip
import copy
import time
from cStringIO import StringIO
from parse_nexson import Study, debug, warn
VERBOSE = True


class LockPolicy(object):
    MAX_NUM_SLEEP_IN_WAITING_FOR_LOCK = os.environ.get('MAX_NUM_SLEEP_IN_WAITING_FOR_LOCK', 100)
    try:
        SLEEP_FOR_LOCK_TIME = float(os.environ.get('SLEEP_FOR_LOCK_TIME', 0.05))
    except:
        SLEEP_FOR_LOCK_TIME = 0.05 

    def __init__(self):
        self.early_exit_if_locked = False
        self.wait_do_not_relock_if_locked = False
        self._reset_current()

    def _reset_current(self):
        self.curr_lockfile, self.curr_owns_lock, self.curr_was_locked = False, False, False

    def _wait_for_lock(self, lockfile):
        '''Returns a pair of bools: lockfile previously existed, lockfile now owned by caller
        '''
        n = 0
        pid = os.getpid()
        previously_existed = False
        while os.path.exists(lockfile):
            previously_existed = True
            n += 1
            if self.early_exit_if_locked or n > LockPolicy.MAX_NUM_SLEEP_IN_WAITING_FOR_LOCK:
                return True, False
            if VERBOSE:
                sys.stderr.write('Waiting for "%s" iter %d\n' % (lockfile, n))
            time.sleep(LockPolicy.SLEEP_FOR_LOCK_TIME)
        if previously_existed and self.wait_do_not_relock_if_locked:
            return True, False
        try:
            o = open(lockfile, 'w')
            o.write(str(pid) + '\n')
            o.close()
        except:
            try:
                self.remove_lock(lockfile)
            except:
                pass
            return previously_existed, False
        else:
            return previously_existed, True
    def wait_for_lock(self, lockfile):
        t = self._wait_for_lock(lockfile)
        self.curr_lockfile = lockfile
        self.curr_was_locked, self.curr_owns_lock = t
        if VERBOSE:
            sys.stderr.write('Lockfile = "%s" was_locked=%s owns_lock=%s\n'% 
                    (lockfile, 
                     "TRUE" if self.curr_was_locked else "FALSE",
                     "TRUE" if self.curr_owns_lock else "FALSE",
                     ))
        return t
    def remove_lock(self):
        try:
            if self.curr_lockfile and self.curr_owns_lock:
                self._remove_lock(self.curr_lockfile)
        finally:
            self._reset_current()
    def _remove_lock(self, lockfile):
        if os.path.exists(lockfile):
            os.remove(lockfile)

def target_is_dirty(src_path_list, dest_path_list, trigger=None):
    if bool(trigger):
        return True
    for p in src_path_list:
        if not os.path.exists(p):
            warn('Source path "%s" does not exist' % p)
            return False
    for dest_path in dest_path_list:
        if not os.path.exists(dest_path):
            return True
    smt = max([os.path.getmtime(i) for i in src_path_list])
    dmt = min([os.path.getmtime(i) for i in dest_path_list])
    return (smt >= dmt) or ('FORCE_PHYLOGRAFTER_STUDY' in os.environ)

def get_default_dir_dict(top_level = None):
    r = '.' if top_level is None else top_level
    t = os.path.abspath(r)
    return  {'nexson_dir': t,
            'treemachine_ingest_dir': os.path.join(t, 'ingest'),
            'to_html_scratch_dir': os.path.join(t, 'ingest'),
            'to_html_output_dir': os.path.join(t, 'status'),
            'nexson_state_db': os.path.join(t, '.to_download.json'), # stores the state of this repo. *very* hacky primitive db.
            }

def get_processing_paths_from_prefix(pref,
                                     nexson_dir='.',
                                     treemachine_ingest_dir='.',
                                     to_html_scratch_dir='.',
                                     to_html_output_dir='.',
                                     nexson_state_db=None):
    d = {'nexson': os.path.abspath(os.path.join(nexson_dir, pref)),
         'treemachine_log': os.path.abspath(os.path.join(treemachine_ingest_dir, pref + '-out.json')),
         'treemachine_err': os.path.abspath(os.path.join(treemachine_ingest_dir, pref + '-err.txt')),
         'html_err': os.path.abspath(os.path.join(to_html_scratch_dir, pref + '-2html-err.txt')),
         'html': os.path.abspath(os.path.join(to_html_output_dir, pref + '.html')),
         'status_json': os.path.abspath(os.path.join(to_html_output_dir, pref + '.json')),
         'nexson_state_db':nexson_state_db,
         }
    if d['nexson_state_db'] is None:
        d['nexson_state_db'] = os.path.abspath(os.path.join(nexson_dir, '.to_download.json')), # stores the state of this repo. *very* hacky primitive db.
    return d


def get_study_filename_list(dir_dict):
    study_to_ingest = os.environ.get('FORCE_PHYLOGRAFTER_STUDY')
    if study_to_ingest is None:
        nt = []
        for fn in os.listdir(dir_dict['nexson_dir']):
            try:
                n = int(fn)
                nt.append((n, fn))
            except:
                pass
        nt.sort()
        return [i[1] for i in nt]
    return [study_to_ingest]

def refresh_of_status_json_from_treemachine_path(paths):
    n_path = paths['nexson']
    study = os.path.split(n_path)[-1]
    e_path = paths['treemachine_log']
    dest_path = paths['html']
    err_path = paths['html_err']

    status_dir = os.path.split(dest_path)[0]
    if not os.path.exists(status_dir):
        os.makedirs(status_dir)
    err_dir = os.path.split(err_path)[0]
    if not os.path.exists(err_dir):
        os.makedirs(err_dir)
    if VERBOSE:
        sys.stderr.write('Processing "%s" to "%s"\n' % (e_path, dest_path))

    oinp = open(paths['nexson'], 'rU')
    inp = open(paths['treemachine_log'], 'rU')

    log_object = json.load(inp)
    orig_object = Study(json.load(oinp))
    
    status_obj = process_treemachine_log_info(log_object, orig_object, study)
    try:
        status_stream = open(paths['status_json'], 'w')
        json.dump(status_obj, status_stream, sort_keys=True, indent=1)
    finally:
        status_stream.close()
    return status_obj

def refresh_html_from_status_obj(paths, status_obj):
    output = open(paths['html'], 'w')
    try:
        write_status_obj_as_html(status_obj, output)
    finally:
        output.close()

def htmlize_treemachine_output(paths):
    status_obj = refresh_of_status_json_from_treemachine_path(paths)
    refresh_html_from_status_obj(paths, status_obj)


def run_treemachine_pg_import_check(paths, lock_policy, treemachine_db=None, treemachine_domain=None):
    l_path = paths['treemachine_log']
    lockfile = l_path + '.lock'
    was_locked, owns_lock = lock_policy.wait_for_lock(lockfile)
    try:
        if not owns_lock:
            return None
        if treemachine_db is not None:
            n_path = paths['nexson']
            err_path = paths['treemachine_err']
            log_err_dir = os.path.split(l_path)[0]
            if not os.path.exists(log_err_dir):
                os.makedirs(log_err_dir)
            ingest_err_dir = os.path.split(err_path)[0]
            if not os.path.exists(ingest_err_dir):
                os.makedirs(ingest_err_dir)
            if VERBOSE:
                sys.stderr.write('Processing "%s" to "%s"\n' % (n_path, l_path))
            err_file = open(err_path, 'w')
            tf = l_path + '.tmpfile'
            cmd = ['treemachine',
                   'pgloadind', 
                   treemachine_db,
                   n_path,
                   tf]
            if VERBOSE:
                sys.stderr.write(' '.join(cmd) + '\n')
            try:
                rc = subprocess.call(cmd, stdout=err_file, stderr=subprocess.STDOUT)
            except:
                pass
            err_file.close()
            if rc == 0:
                os.rename(tf, l_path)
                return json.load(open(l_path, 'rU'))
            return None
        elif treemachine_domain is not None:
            n_path = paths['nexson']
            nexsonBlob = open(n_path, 'rU').read()
            headers = {
                'content-type' : 'application/json',
                'accept' : 'application/json',
            }
            p = '/ext/GoLS/graphdb/getStudyIngestMessagesForNexSON'
            if treemachine_domain.startswith('http://127.0.0.1'):
                p = '/db/data' + p
            SUBMIT_URI = treemachine_domain + p
            resp = requests.post(SUBMIT_URI,
                         headers=headers,
                         data=json.dumps({'nexsonBlob': nexsonBlob}),
                         allow_redirects=True)
            resp.raise_for_status()
            results = resp.json()
            l_path = paths['treemachine_log']
            log_err_dir = os.path.split(l_path)[0]
            if not os.path.exists(log_err_dir):
                os.makedirs(log_err_dir)
            if isinstance(results, unicode) or isinstance(results, str):
                results = json.loads(results)
            store_state_JSON(results, l_path)
            return results
        else:
            raise ValueError('treemachine_domain or treemachine_db must be specified')
    finally:
        lock_policy.remove_lock()

def store_state_JSON(s, fp):
    tmpfilename = fp + '.tmpfile'
    td = open(tmpfilename, 'w')
    try:
        json.dump(s, td, sort_keys=True, indent=0)
    finally:
        td.close()
    os.rename(tmpfilename, fp) #atomic on POSIX

def get_previous_list_of_dirty_nexsons(dir_dict):
    filename = dir_dict['nexson_state_db']
    if os.path.exists(filename):
        old = json.load(open(filename, 'rU'))
    else:
        old = {'from': '2010-01-01T00:00:00',
               'to': '2010-01-01T00:00:00',
               'studies': []
        }
    return old['studies'], old

def get_list_of_dirty_nexsons(dir_dict):
    filename = dir_dict['nexson_state_db']
    slist, old = get_previous_list_of_dirty_nexsons(dir_dict)
    DOMAIN = os.environ.get('PHYLOGRAFTER_DOMAIN_PREF')
    if DOMAIN is None:
        DOMAIN = 'http://www.reelab.net/phylografter'

    SUBMIT_URI = DOMAIN + '/study/modified_list.json/url'
    args = {'from': old['to']}
    headers = {'content-type': 'application/json'}
    resp = requests.get(SUBMIT_URI, params=args, headers=headers)
    resp.raise_for_status()
    new_resp = resp.json()
    ss = set(new_resp['studies'] + old['studies'])
    sl = list(ss)
    sl.sort()
    new_resp['studies'] = sl
    new_resp['from'] = old['from']
    store_state_JSON(new_resp, filename)
    to_refresh = list(new_resp['studies'])
    return to_refresh, new_resp

def download_nexson_from_phylografter(paths, download_db, lock_policy):
    DOMAIN = os.environ.get('PHYLOGRAFTER_DOMAIN_PREF')
    if DOMAIN is None:
        DOMAIN = 'http://www.reelab.net/phylografter'

    headers = {
            'accept-encoding' : 'gzip',
            'content-type' : 'application/json',
            'accept' : 'application/json',
        }
    nexson = paths['nexson']
    lockfile = nexson + '.lock'
    was_locked, owns_lock = lock_policy.wait_for_lock(lockfile)
    try:
        if not owns_lock:
            return False
        study = os.path.split(nexson)[-1]
        if VERBOSE:
            sys.stderr.write('Downloading %s...\n' % study)
        SUBMIT_URI = DOMAIN + '/study/export_gzipNexSON.json/' + study
        resp = requests.get(SUBMIT_URI,
                         headers=headers,
                         allow_redirects=True)
        resp.raise_for_status()
        try:
            uncompressed = gzip.GzipFile(mode='rb', fileobj=StringIO(resp.content)).read()
            results = uncompressed
        except:
            raise 
        if isinstance(results, unicode) or isinstance(results, str):
            er = json.loads(results)
        else:
            raise RuntimeError('Non gzipped response, but not a string is:', results)
        should_write = False
        if not os.path.exists(study):
            should_write = True
        else:
            prev_content = json.load(open(study, 'rU'))
            if prev_content != er:
                should_write = True
        if should_write:
            store_state_JSON(er, study)
        if download_db is not None:
            try:
                download_db['studies'].remove(int(study))
            except:
                warn('%s not in %s' % (study, paths['nexson_state_db']))
                pass
            else:
                store_state_JSON(download_db, paths['nexson_state_db'])
    finally:
        lock_policy.remove_lock()
    return True



###############################################################################
# Code associated with parsing NexSON + treemachine log into status JSON

def _unexpected_dup(el):
    raise RuntimeError('Unexpected duplicate element with label "%s"' % el['label'])

def _add_unique(source, dest, sn, dn):
    dn not in dest or _unexpected_dup(el)
    dest[dn] = source[sn]


TO_IGNORE_LABELS = ('setting ingroup root node.',
                    'conducting tnrs on trees',
                    'taxon mapping summary',
                    'finished with attempts to fix names',
                    'tnrs unmatched',
    )
def _update_keys(dest, src, key_list):
    for k in key_list:
        if k in src:
            dest[k] = src[k]

def _add_otu_from_node_nexsonid(dest, nexsonid, nexson_obj):
    assert nexsonid
    if nexsonid:
        n = nexson_obj.node_for_nexsonid(nexsonid)
        assert n
        if n:
            dest['otu_obj'] = n.otu.as_core_dict()

def _process_tree_part_log_info(curr_tree, part_info, nexson_obj):
    prev_subtree = None
    for el in part_info:
        if isinstance(el, list):
            dup_dict = {}
            overlap_dict = {}
            for sub in el:
                label = sub['label'].lower()
                if label == 'matched anc':
                    assert prev_subtree is not None
                    prev_subtree['name'] = sub.get('name')
                    prev_subtree['node'] = sub.get('node')
                elif label == 'duplicate':
                    _update_keys(dup_dict, sub, ['name', 'OTT ID', 'nexsonid'])
                elif label == 'overlapping retained':
                    _update_keys(overlap_dict.setdefault('retained', {}), sub, ['name', 'nexsonid'])
                elif label == 'overlapping pruned':
                    _update_keys(overlap_dict.setdefault('pruned', {}), sub, ['name', 'nexsonid'])
                elif label not in TO_IGNORE_LABELS:
                    warn('Ignored label "%s" in tree' % label)
            if len(dup_dict) > 0:
                _add_otu_from_node_nexsonid(dup_dict, dup_dict.get('nexsonid'), nexson_obj)
                curr_tree['reused_tip_labels'].append(dup_dict)
            if len(overlap_dict) > 0:
                r = overlap_dict['retained']
                _add_otu_from_node_nexsonid(r, r.get('nexsonid'), nexson_obj)
                p = overlap_dict['pruned']
                _add_otu_from_node_nexsonid(p, p.get('nexsonid'), nexson_obj)
                curr_tree['overlapping_tip_taxa'].append(overlap_dict)
        else:
            label = el['label'].lower()
            if label == 'taxon mapping':
                by_ott = curr_tree.setdefault('by_ott', {})
                ott_id = el['OTT ID']
                by_ott[el['OTT ID']] = {'taxonomy': el['taxonomy']}
            elif label == 'subtree':
                sd = {} # Change the following to the rvalue to retain the subtrees... => curr_tree.setdefault('subtrees', {})
                n = el['newick']
                prev_subtree = {}
                sd[n] = prev_subtree
            elif label == 'ott id reused in tree':
                curr_tree.setdefault('reused_tip_labels', [])
            elif label == 'overlapping tips':
                curr_tree.setdefault('overlapping_tip_taxa', [])
            elif label == 'pruning dups and overlapping':
                _add_otu_from_node_nexsonid(el, el.get('nexsonid'), nexson_obj)
                curr_tree.setdefault('pruned_dup', []).append(el)
            elif label == 'pruning unmapped':
                _add_otu_from_node_nexsonid(el, el.get('nexsonid'), nexson_obj)
                curr_tree.setdefault('pruned unmapped', []).append(el)
            elif label == 'error ottolid indexed to a null node!':
                curr_tree.setdefault('null_ottol_ids_in_final_mapping', []).append(el)
            elif label == 'null ott id for node':
                curr_tree.setdefault('null ott id for node', []).append(el)
            elif label == 'ott id missing':
                curr_tree.setdefault('ott id missing', []).append({'name': el['name'], 'nexsonid': el['nexsonid']})
            elif label == 'tnrs resolved ottolid':
                nid = el['nexsonid']
                searched_on = el['searched on']
                ott_id = el['OTT ID']
                name = el['name']
                c = nexson_obj.__dict__.get('corrected', {})
                node = nexson_obj.node_for_nexsonid(nid)
                nexsontree = nexson_obj.tree_nexsonid_to_tree[curr_tree['id']]
                oid2node = nexsontree.ottid_to_node_list
                nl = oid2node[node.otu.ott_id]
                assert node in nl
                nl.remove(node)
                new_otu_list = oid2node.get(ott_id)
                if new_otu_list is None or len(new_otu_list) == 0:
                    o = OTU({'@id': None, '@label':name, 'meta':None})
                    o.original_label = searched_on
                    o.ott_id = ott_id
                    nexson_obj.otu_list.append(o)
                    oid2node[ott_id] = [node]
                else:
                    node.otu = new_otu_list[0].otu
                    new_otu_list.append(node)
                curr_tree.setdefault('tnrs resolved ottolid', []).append({'searched on': searched_on, 
                                                                          'OTT ID': ott_id,
                                                                          'name': name,
                                                                          'nexsonid': nid})
            elif label not in TO_IGNORE_LABELS:
                warn('Ignored label "%s" in part' % label)


def _process_tree_log_info(curr_tree, tree_list, tree_id2tree, tree_notes, nexson_obj):
    TREE_INFO_LABELS = ('tree info',
                        'ingested tree',
                        'property added',
                        )
    TREE_ID_BEARING_LABELS = ('checking for uniqueness of ott ids',
                              'name fixing on tree',
                              'checking if tree could be added to graph',
                              'null or duplicate names. skipping tree'
                                )
    for el in tree_notes:
        try:
            label = el['label'].lower()
        except:
            _process_tree_part_log_info(curr_tree, el, nexson_obj)
        else:
            if label in TREE_INFO_LABELS:
                for k, v in el.items():
                    if k != 'label':
                        if k == 'ot:tag':
                            curr_tree.setdefault(k, []).append(v)
                        else:
                            if k in curr_tree:
                                warn('Overwriting "%s" -> "%s" with value "%s"' %(k, curr_tree[k], v))
                            curr_tree[k] = v
            elif label in TREE_ID_BEARING_LABELS: # check index in case a tree has been omitted...
                tid = el['tree id']
                if tid != curr_tree['id']:
                    debug('%s swapping curr_tree to tree with id %s' % (str(el), tid))
                    curr_tree = tree_id2tree[tid]
                if label == 'null or duplicate names. skipping tree':
                    curr_tree['can be ingested'] = False
            elif label == 'all nodes have ottolids':
                curr_tree['had_ott_ids_before_tnrs'] = True
            elif label == 'postpruning newick':
                curr_tree['postpruning newick'] = el['tree']
            elif label not in TO_IGNORE_LABELS:
                warn('Ignored label "%s" in tree' % label)

def get_ott_id_to_taxon_map(otu_list):
    '''Takes a parse_nexson.OTUList returns a map from OTT ID to list of parse_nexson.OTU object'''
    d = {}
    for otu in otu_list:
        oid = otu.ott_id
        d.setdefault(oid, []).append(otu)
    return d

def process_treemachine_log_info(log_obj, nexson_obj, default_study_id):
    '''Returns study_info_dict, list_of_tree_info objects
    '''
    nexson_obj.incoming_ottid_to_otu = get_ott_id_to_taxon_map(nexson_obj.otu_list)
    study = {}
    tree_list = []
    context_el = None
    tree_id2tree = {}
    for el in log_obj:
        try:
            label = el['label'].lower()
            if label == 'otus':
                _add_unique(el, study, 'number', 'num_otus')
                context_el = study
            elif label == 'study tagged as deprecated. ignore.':
                study['Deprecated'] = 'Study tagged as deprecated.'
            elif label == 'processing tree':
                tree_list.append({})
                context_el = tree_list[-1]
                context_el['tree_index'] = len(tree_list) - 1
                _add_unique(el, context_el, '@id', 'id')
                tree_id2tree[context_el['id']] = context_el
            elif label =='tree tagged as deprecated. ignoring.':
                tid = el['@id']
                tree_id2tree[tid]['deprecated'] = True
            elif label not in TO_IGNORE_LABELS:
                warn('Ignored label "%s"' % label)
        except:
            _process_tree_log_info(context_el, tree_list, tree_id2tree, el, nexson_obj)
    
    # move study info to study dict
    STUDY_INFO_PREFIXES = ['ot:study', 'ot:dataDeposit', 'ot:curatorName']
    for tree in tree_list:
        for k in tree.keys():
            is_study_info = False
            for p in STUDY_INFO_PREFIXES:
                if k.startswith(p):
                    is_study_info = True
            if is_study_info:
                if k in study:
                    assert study[k] == tree[k]
                else:
                    study[k] = tree[k]
                del tree[k]

    # process NexSON and tm out and add some helpful fields to the dicts
    importable_count =0 
    phylografter_domain = 'http://www.reelab.net/phylografter/'
    for tree in tree_list:
        i = diagnose_tree_status(tree, nexson_obj)
        tree['importable_into_treemachine'] = 'true' if i else 'false'
        if i:
            importable_count += 1
        tid = tree['id']
        tree['phylografter_tree_link'] = phylografter_domain + 'stree/svgView/' + tid
    study['num_trees_importable'] = importable_count

    study['phylografter_study_id'] = study.get('ot:studyId', default_study_id)
    study['phylografter_study_link'] = phylografter_domain + 'study/view/' + study['phylografter_study_id']
    return {'study_info': study,
            'tree_list': tree_list}

def diagnose_tree_status(t, nexson_obj):
    tid = t['id']
    nexson_tree = nexson_obj.tree_nexsonid_to_tree[tid]
    reasons = []
    status = {'text': '', 'reasons': reasons}
    if t.get('deprecated', False):
        status['text'] = 'Excluded. '
        reasons.append({'rc':'USER', 'reason':'user', 'details':'flagged tree as deprecated'})
    ################################################################
    # convert info about overlapping pruned/duplicated leaves into an easier to deal with structure
    r = t.get('tnrs resolved ottolid')
    # Prepare the warning list for repeated OTT IDs. A complication is that treemachine
    #   emits data about the 2nd, 3rd.... use of an OTT ID, but does not give info about the first 
    #   taxon that uses the OTT ID.  nexson_tree.ottid_to_node_list should map to a list with
    #   one more element than the tree machine warnings
    if r:
        status['text'] = 'Warning: some taxa will be remapped by TNRS calls by treemachine.'
        for el in r:
            reasons.append({'rc':'TNRS', 
                            'reason':'Warning: TNRS identifies "%s" ( OTTID %s)' % (el['name'], str(el['OTT ID'])), 
                            'details': el})
    ################################################################
    # convert info about reused OTT ID into an easier to deal with structure
    r = t.get('reused_tip_labels')
    # Prepare the warning list for repeated OTT IDs. A complication is that treemachine
    #   emits data about the 2nd, 3rd.... use of an OTT ID, but does not give info about the first 
    #   taxon that uses the OTT ID.  nexson_tree.ottid_to_node_list should map to a list with
    #   one more element than the tree machine warnings
    if r:
        status['text'] = 'Has multiple leaves mapping to the same OTT ID. '
        ott_it_map = copy.deepcopy(nexson_tree.ottid_to_node_list)
        non_rep = []
        for k, v in ott_it_map.iteritems():
            if k is not None and len(v) == 1:
                non_rep.append(k)
        for k in non_rep:
            del ott_it_map[k]
        k_order = []
        o2r_map = {}
        for el in r:
            ott_id = el['OTT ID']
            if ott_id is None:
                continue
            otu_dict = el['otu_obj']
            nid = el['nexsonid']
            nt_val = ott_it_map[ott_id]
            node_to_pop = None
            for n in nt_val:
                if n.nexsonid == nid:
                    assert node_to_pop is None
                    node_to_pop = n
            assert node_to_pop is not None
            nt_val.remove(node_to_pop)
            k = 'repeated "%s" ( OTTID %s )' % (otu_dict['normalized_label'], str(ott_id))
            r_list = o2r_map.setdefault(ott_id, [])
            if len(r_list) == 0:
                k_order.append(ott_id)
            r_list.append({'reason':k, 'original label': otu_dict['original_label'], 'OTT ID':ott_id})
        for k, v in ott_it_map.iteritems():
            if k is None:
                continue
            for c, node in enumerate(v):
                otu = node.otu
                ott_id = otu.ott_id
                k = 'repeated "%s" ( OTTID %s )' % (otu.normalized_label, str(ott_id))
                if ott_id not in o2r_map:
                    k = 'undetected ' + k + ' (unproblematic if in outgroup)'
                    if ott_id not in o2r_map:
                        k_order.append(ott_id)
                r_list = o2r_map.setdefault(ott_id, [])
                d = {'reason':k, 'original label': otu.original_label, 'OTT ID': ott_id}
                if c == 0:
                    r_list.insert(0, d)
                else:
                    r_list.append(d)
        for tag in k_order:
            v = o2r_map[tag]
            r = v[0]['reason']
            reasons.append({'rc':'DUPLICATE', 'reason':r, 'details':v})
    ################################################################
    # convert info about overlapping pruned/duplicated leaves into an easier to deal with structure
    r = t.get('overlapping_tip_taxa')
    # Prepare the warning list for repeated OTT IDs. A complication is that treemachine
    #   emits data about the 2nd, 3rd.... use of an OTT ID, but does not give info about the first 
    #   taxon that uses the OTT ID.  nexson_tree.ottid_to_node_list should map to a list with
    #   one more element than the tree machine warnings
    if r:
        status['text'] = 'Has nested taxa in the OTT taxomonomy mapping to tips of the tree. '
        for el in r:
            ret = el['retained']
            rotu_dict = ret['otu_obj']
            pru = el['pruned']
            potu_dict = pru['otu_obj']
            d = {
                'retained' : {'name': rotu_dict['normalized_label'],
                              'original label': rotu_dict['original_label'],
                              'OTT ID': rotu_dict['ott_id'],
                             },
                'pruned' : {'name': potu_dict['normalized_label'],
                              'original label': potu_dict['original_label'],
                              'OTT ID': potu_dict['ott_id'],
                           },
                }
            reasons.append({'rc':'OVERLAPPING', 'reason':'Warning: overlapping taxa', 
                            'details': d})
    ################################################################
    # convert info about pruned/duplicated leaves into an easier to deal with structure
    p = t.get('pruned_dup')
    if p:
        status['text'] += 'Leaves pruned to avoid duplication/overlapping content. '
        for el in p:
            potu_dict = el['otu_obj']
            ott_id= potu_dict['ott_id']
            r = 'Warning: pruned a taxon mapped to "%s" ( OTTID %s )' % (potu_dict['normalized_label'], str(ott_id))
            reasons.append({'rc': 'PRUNING', 'reason':r, 'details': {'original label':potu_dict['original_label'], 'OTT ID': ott_id}})
    p = t.get('pruned unmapped')
    if p:
        status['text'] += 'Unmapped leaves pruned. '
        for el in p:
            potu_dict = el['otu_obj']
            r = 'Warning: pruned an unmapped taxon'
            reasons.append({'rc': 'PRUNING_UNMAPPED', 'reason':r, 'details': {'original label':potu_dict['original_label']}})
    n1 = [i['original name'] for i in t.get('null_ottol_ids_in_final_mapping', [])]
    n2 = [i['name'] for i in t.get('null ott id for node', [])]
    s = None
    if n1:
        s = _summarize_list(n1, 'original name')
    elif n2:
        s = _summarize_list(n2, 'name')
    if s is not None:
        status['text'] = status['text'] + 'Has leaves with empty OTT IDs. '
        for n in s:
            reasons.append({'rc': 'NULLID', 'reason':'null OTT ID', 'details':n})
    ret = False
    if not status['text']:
        ret = True
        if t.get('had_ott_ids_before_tnrs'):
            status['text'] = 'Can be imported.'
        else:
            status['text'] = 'Can be imported using taxomachine TNRS.'
    elif not t.get('had_ott_ids_before_tnrs'):
        status['text'] = status['text'] + 'taxomachine TNRS used to find some OTT IDs. '
    t['status'] = status
    nexson_tree.status = status
    return ret

###############################################################################
# Code for converting JSON to html.

def proc_val_for_html(v):
    try:
        if v.startswith('http:'):
            return u'<a href="' + v + u'">' + v + u'</a>'
    except:
        pass
    return unicode(v)

def _summarize_list(inp, tag):
    uort = []
    d = {}
    for i in inp:
        if i not in d:
            d[i] = 1
            uort.append(i)
        else:
            d[i] = 1 + d[i]
    return [{tag: i, 'count': d[i]} for i in uort]


def warn_html(m):
    return '<font color="red"><b>' + m + '</b></font>'

def _display_user_status_code(output, row):
    output.write('        <tr><td>%s</td><td>%s</td>\n' % (row['reason'], proc_val_for_html(row['details']))) 
def _display_duplicate_taxon_status_code(output, row):
    ol = [i['original label'] for i in row['details']]
    p = str(len(ol)) + ' taxa mapped to this OTT taxon. '
    t = p + 'Their original labels were: "' + '", "'.join(ol) + '"'
    output.write('        <tr><td>%s</td><td>%s</td>\n' % (row['reason'], proc_val_for_html(t))) 
def _display_overlapping_taxon_status_code(output, row):
    d = row['details']
    pru = d['pruned']
    ret = d['retained']
    p = 'To resolve this situation, "%s" ( OTTID %s ; original label "%s" ) was pruned. ' % (pru['name'], pru['OTT ID'], pru['original label'])
    r = '"%s" ( OTTID %s ; original label "%s" ) was retained. ' % (ret['name'], ret['OTT ID'], ret['original label'])
    t = p + r
    output.write('        <tr><td>%s</td><td>%s</td>\n' % (row['reason'], proc_val_for_html(t))) 

def _display_pruning_taxon_status_code(output, row):
    d = row['details']
    t = 'The original label of the pruned taxon was "%s"' % (d['original label'])
    output.write('        <tr><td>%s</td><td>%s</td>\n' % (row['reason'], proc_val_for_html(t))) 

def _display_tnrs_taxon_status_code(output, row):
    d = row['details']
    t = 'Name searched for in TNRS was "%s"' % (d['searched on'])
    output.write('        <tr><td>%s</td><td>%s</td>\n' % (row['reason'], proc_val_for_html(t))) 
def _display_null_taxon_status_code(output, row):
    output.write('        <tr><td>%s</td><td>%s</td>\n' % (row['reason'], proc_val_for_html(row['details']))) 

def write_status_obj_as_html(status_obj, output):
    '''
    Writes the status html

    Takes:
        `status_obj` a dict parsed from "status JSON"
        `output` a file-like obj
    '''
    study_info= status_obj['study_info']
    tree_list = status_obj['tree_list']
    phylografter_study_id = study_info['phylografter_study_id']
    phylografter_study_link = study_info['phylografter_study_link']

    output.write('''<html>
<head>
    <title>Snaphsot of treemachine status for phylografter study %s</title>
</head>''' % phylografter_study_id)
    output.write('''<body>
<h2>Study Info</h2>
    <p><a href="%s">%s</a></p>
    <table border="1">
''' % (phylografter_study_link, phylografter_study_link))
    kl = study_info.keys()
    kl.sort()
    for k in kl:
        v = study_info[k]
        output.write('        <tr><td>' + str(k) + '</td><td>' + proc_val_for_html(v) + '</td>\n') 
    output.write('''    </table>
''')

    ##############################3
    # Write tree info
    ##############################3
    to_ignore_keys =[ 'tree_index', ]
    detail_keys = ['number of external nodes', 
                   'number edges',
                   'number nodes',
                   'ot:tag', # [tag, tag]
                          ]
    verbose_keys = ['postpruning newick', # newick string
                    'subtrees', # dict. Keys newick -> dict with name and node keys
                    'by_ott' # {ottID -> {'taxonomy', }}
                   ]
    valuable_tree_keys = ['id', 
                          'ot:branchLengthMode', 
                          'ingroup', 
                          'ot:inGroupClade',
                          'ot:focalClade']
    special_keys = ['status',
                    'had_ott_ids_before_tnrs', # bool
                    'deprecated', # bool
                    'reused_tip_labels', #  
                    'pruned_dup', #  = [name, name, ...]
                    'null_ottol_ids_in_final_mapping', # ['original name']
                    'null ott id for node', # ['name']
                    'overlapping_tip_taxa', 
                    'importable_into_treemachine',
                    'phylografter_tree_link',
                    'ott id missing',
                    'tnrs resolved ottolid',
                    'pruned unmapped',
                    ]
    keys_to_lists = ['ot:tag']
    all_known_tree_keys = special_keys + verbose_keys + valuable_tree_keys + detail_keys + to_ignore_keys
    num_importable = study_info['num_trees_importable']
    for tree in tree_list:
        tid = tree['id']
        phylografter_tree_link = tree['phylografter_tree_link']
        output.write('''<h3>Tree %s</h3>
    <p><a href="%s">%s</a></p>
    ''' % (tid, phylografter_tree_link, phylografter_tree_link))
        # STATUS
        output.write('''<p><b>Status: </b>%s</p>
    ''' % (tree['status']['text']))
        r = tree['status']['reasons']
        if r:
            output.write('''<table border="1">
''' )
        for row in r:
            rc = row['rc']
            if rc == 'USER':
                _display_user_status_code(output, row)
            elif rc == 'DUPLICATE':
                _display_duplicate_taxon_status_code(output, row)
            elif rc == 'OVERLAPPING':
                _display_overlapping_taxon_status_code(output, row)
            elif rc in ['PRUNING', 'PRUNING_UNMAPPED']:
                _display_pruning_taxon_status_code(output, row)
            elif rc == 'TNRS':
                _display_tnrs_taxon_status_code(output, row)
            else:
                assert rc == 'NULLID'
                _display_null_taxon_status_code(output, row)
        output.write('''    </table>
''')

        # STATUS
        output.write('''<p><b>Info</b></p>
    ''')
        output.write('''<table border="1">\n    ''')
        kl = tree.keys()
        for k in kl:
            if k not in all_known_tree_keys:
                warn('Unexpected key in tree: ' + k)
        for k in keys_to_lists:
            tl = tree.get(k)
            if tl is not None:
                tree[k] = '"%s"' % '", "'.join(tl)
        for k in valuable_tree_keys + detail_keys:
            try:
                v = tree[k]
                output.write('        <tr><td>%s</td><td>%s</td>\n' % (k, proc_val_for_html(v))) 
            except:
                output.write('        <tr><td>%s</td><td>%s</td>\n' % (k, warn_html("Missing!"))) 
        output.write('''    </table>
    <hr/>
''')
    if num_importable != 1:
        output.write('<p>' + warn_html(str(num_importable) + ' trees') + ' importable from this study!</p>\n')
    else:
        output.write('<p>1 tree importable from this study.</p>\n')
    output.write('''</body>
</head>
''')
