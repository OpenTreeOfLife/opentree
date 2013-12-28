# Index Fungorum Conversion Tool
# Converts Index Fungorum exports (IF and FDC) plus update files in
# Open Tree of Life smasher taxonomy files

# usage python if.py [if_file fdc_file [log_file [taxonomy_results synonym_results]]]
# defaults as follows: 
DEFAULT_IF_NAME = 'qryAAA-ExportIF-2.txt'
DEFAULT_FDC_NAME = 'qryAAA-ExportFDC-2.txt'
DEFAULT_LOG_NAME = 'if.log'
DEFAULT_TAXONOMY_NAME = 'taxonomy.tsv'
DEFAULT_SYNONYMS_NAME = 'synonyms.tsv'

# The provided files seem to have been provided in the latin-1 character set
# If this changes, change here and maybe the calls to utf8e can disappear as well
INPUT_ENCODING = 'latin-1'

import sys
import codecs
import logging


# ID's of problem taxa; many of these have been reported to Paul Kirk
# 90157 is a class that is unhelpfully called 'fungi'
# 532576 is 'Le-ratia smaragdine' - there is an captalization inconsistency
# 580198 is 'Le Ratia coccinea' - same
# 522581 is Dictyocoela berillonum
# 522582 is Dictyocoela cavimanum
# 522583 is Dictyocoela deshayesum
# 522584 is Dictyocoela duebenum
# 522585 is Dictyocoela gammarellum
# 522586 is Dictyocoela muelleri
# 81426 is 'used as a family name' but has no taxonomy
# 530139 is Aciascus purpureus
# 28719 is Palaeoclavaria
# 80048 is Tubulicrinaceae
# 80750 is Eremascaceae Imperfectae
# 80920 is Laboulbeniaceae heterothallicae
# 80921 is Laboulbeniaceae homothallicae
# 81426 is Sterile Mycelia 
# 99044 is Developayellaceae
# 569720 is Petsamomyces polymorphus
# 580824 is Polyrrhina multiformis
# 580845 is Rhizolpidium sporoctonum
# 518687 is Afrocantharellus
# 800896 is Proliferosphaera capsici
# 801343 is Glutinoglossum
# 491285 is Corynebacterium minutissimum
# 515429 is Glomerellales
# 373082 is Palaeoclavaria burmitis

KNOWNBAD = [u'90157',u'532576',u'580198',u'522581',u'522582',u'522583',
            u'522584',u'522585',u'522586',u'81426',u'550139',u'28719',
            u'80048',u'80750',u'80920',u'80921',u'81426',u'99044',
            u'569720',u'580824',u'580845',u'518687',u'800896',
            u'801343',u'491285',u'515429',u'373082']

def startup(args):
    if len(args) == 3:
        names_fname = args[1]
        taxonomy_fname = args[2]
        log_fname = DEFAULT_LOG_NAME
        results_fname = DEFAULT_TAXONOMY_NAME
        synonyms_fname = DEFAULT_SYNONYMS_NAME
    elif len(args) == 4:
        names_fname = args[1]
        taxonomy_fname == args[2]
        log_fname == args[3]
        results_fname = DEFAULT_TAXONOMY_NAME
        synonyms_fname = DEFAULT_SYNONYMS_NAME
    elif len(args) == 6:
        names_fname = args[1]
        taxonomy_fname == args[2]
        log_fname == args[3]
        results_fname = args[4]
        synonyms_fname = args[5]
    else:
        names_fname = DEFAULT_IF_NAME
        taxonomy_fname = DEFAULT_FDC_NAME
        log_fname = DEFAULT_LOG_NAME
        results_fname = DEFAULT_TAXONOMY_NAME
        synonyms_fname = DEFAULT_SYNONYMS_NAME

    logging.basicConfig(filename=log_fname,
                        filemode='w',
                        level=logging.INFO,
                        format='%(levelname)-8s: %(message)s')

    logging.info("Processing taxonomy from %s", taxonomy_fname)
    logging.info("Processing names from %s\n", names_fname)

    try:
        names_file = codecs.open(names_fname,"r",INPUT_ENCODING)
        name_rows = get_dicts(names_file)
    except IOError as e:
        msg = "opening %s as names file" % str(e)
        print "Error: " +  msg
        logging.error(msg)
        sys.exit(1)
        
    try:
        taxonomy_file = codecs.open(taxonomy_fname,"r",INPUT_ENCODING)
        taxonomy_rows = get_dicts(taxonomy_file)
    except IOError as e:
        msg = "opening %s as taxonomy file" % str(e)
        print "Error: " + msg
        logging.error(msg)
        sys.exit(1)


    fdc_dict = dict()
    for row in taxonomy_rows:
        #sanity checking - doesn't seem to happen
        if not 'FDC-PK' in row:
            logging.warning("found taxonomy row without FDC-PK: %s", str(row))
        else:
            if row['FDC-PK'] in fdc_dict:
                logging.warning("duplicate FDC-PK found %s", str(row))
            else:
                fdc_dict[row['FDC-PK']] = row

    fdc_set = init_fdc_set(fdc_dict)

    if_id_dict = fill_if_dict(name_rows)
    name2taxon = dict()
    name2synonym = dict()
    taxon_table = []
    synonyms = []
    taxon_rows = []
    for row in name_rows:
        name = row['Name']
        display_name = utf8e(name)
        display_id = utf8e(row['IF-ID'])
        logging.info('Processing name: %s with id %s ***',display_name,display_id)
        if row['IF-ID'] in KNOWNBAD:
            row['status'] = 'invalid'
            logging.info("Rejecting knownbad id %s",display_id)
        elif 'CurrentNameID' in row and (row['IF-ID'] != row['CurrentNameID']):
            logging.info("Found synonym %s; IF-ID %s; CurrentNameID %s",display_name,display_id,utf8e(row['CurrentNameID']))
            real_id = resolve_synonym(row,if_id_dict)
            row['CurrentNameID'] = real_id
            synonyms.append(row)
            name2synonym[name] = row
            row['status'] = 'synonym'
        elif 'CurrentNameID' not in row:
            # last chance lookup for higher level taxa
            if fdc_find(name,fdc_set):
                logging.info('found unsupported name in hard lineage search %s',display_name)
                if row['IF-ID'] not in KNOWNBAD:
                    validate_name(name2taxon,name,row,taxon_rows)
                    logging.info('Adding %s to name to taxon with id %s',display_name,display_id)
                else:
                    logging.info('Rejecting known bad Name: %s, id: %s',display_name,display_id)
            elif len(name.split(' ')) == 2:
                logging.info('trying unsupported species %s',display_name)
                if row['IF-ID'] not in KNOWNBAD:
                    validate_name(name2taxon,name,row,taxon_rows)
                    logging.info('Adding %s to name to taxon with id %s',display_name,display_id)
            else:
                logging.info("rejecting name w/o Current ID: %s",display_name)
                row['status'] = 'invalid' 
        elif name in name2taxon:
            current_authority = format_authority(row)
            existing_row = name2taxon[name]
            existing_authority = format_authority(existing_row)
            logging.info("duplicate taxon name existing: %s; new: %s",existing_authority,current_authority)
            existing_msg = "Existing id: %s " % existing_row['IF-ID'] 
            if "FDC-FK" in existing_row:
                existing_msg = existing_msg + ("; FDC-FK: %s" % existing_row['FDC-FK'])
            if "CurrentNameID" in existing_row:
                existing_msg = existing_msg + ("; CurrentNameID: %s" % existing_row['CurrentNameID'])
            logging.info(existing_msg)
            new_msg = "new id: " + row['IF-ID'] 
            if "FDC-FK" in row:
                new_msg = new_msg + "; FDC-FK: " + row['FDC-FK']
            if "CurrentNameID" in row:
                new_msg = new_msg + ("; CurrentNameID: %s" % row['CurrentNameID'])
            logging.info(new_msg)
        else:
            validate_name(name2taxon,name,row,taxon_rows)
            logging.info("Adding %s to name to taxon with id %s",display_name,display_id)
    get_taxonomy(name_rows,fdc_dict,name2taxon,name2synonym) #second pass
    write_taxonomy(results_fname,name_rows,name2taxon)
    write_synonyms(synonyms_fname,synonyms)



def validate_name(name2taxon,name,row,taxon_rows):
    """marks name as valid and updates lists and mappings """
    name2taxon[name] = row
    row['status'] = 'available'
    taxon_rows.append(row)


def get_taxonomy(name_rows,fdc_dict,name2taxon,name2synonym):
    """ """
    for row in name_rows: 
        if 'status' in row:
            if row['status'] == 'available':
                get_rank(row,fdc_dict)
                if 'rank' not in row:
                    row['rank'] = 'no rank'
                get_parent(row,fdc_dict,name2taxon,name2synonym)


def is_synonym(row):
    """
    tests if the if id and the current name id differ, which indicates a synonym
    """
    return 'CurrentNameID' in row and (row['IF-ID'] != row['CurrentNameID'])

def format_authority(row):
    """
    Generates an authority string for a name
    """
    name_str = utf8e(row['Name'])
    if 'Author' in row:
        author_str = utf8e(row['Author'])
    else:
        author_str = ''
    if 'Year' in row:
        year_str = utf8e(row['Year'])
    else:
        year_str = ''
    return  "%s (%s, %s)" %(name_str,author_str,year_str)

TAXON_HEADER = "uid\t|\tparent_uid\t|\tname\t|\trank\t|\t\n"
TAXON_TEMPLATE = "%s\t|\t%s\t|\t%s\t|\t%s\t|\t\n"

def write_taxonomy(taxonomy_fname,name_table,name2taxon):
    """
    Opens and writes lines in the taxonomy file corresponding to
    each valid (available) name
    """
    try:        
        taxonomy_file = codecs.open(taxonomy_fname,"w","utf-8")
        taxonomy_file.write(TAXON_HEADER)
        for row in name_table:
            if 'id' in row:
                uid = row['id']
            elif 'CurrentNameID' in row:
                uid = row['CurrentNameID']
            else:
                uid = row['IF-ID']
            name = row['Name']
            if 'parent' in row:
                parent = row['parent']
            else:
                parent = ''
            if 'rank' in row:
                rank = row['rank']
            else:
                rank = 'no rank'
            if 'status' in row and row['status'] == 'available':
                outstr = TAXON_TEMPLATE % (uid,parent,name,rank)
                taxonomy_file.write(outstr)
        taxonomy_file.close()
    except IOError as e:
        logging.error("error %s opening/writing %s as taxonomy file file",str(e),taxonomy_fname)
        

SYNONYM_HEADER = "uid\t|\tname\t|\ttype\t|\tTBD\t|\n"
SYNONYM_TEMPLATE = "%s\t|\t%s\t|\t%s\t|\t%s\t|\t\n"

def write_synonyms(synonyms_fname,synonyms):
    """
    Opens and writes lines in the synonyms file corresponding to
    each name identified as a synonym (IF id != Current Name id)
    If authority information is available, it will appear in the
    third column, prefix by 'authority', rather than by 'synonym'     
    """
    try:
        synonyms_file = codecs.open(synonyms_fname,"w","utf-8")
        synonyms_file.write(SYNONYM_HEADER)
        for syn in synonyms:
            if 'CurrentNameID' in syn:  #if no id, then nothing worth writing
                if 'Author' in syn and 'Year' in syn:
                    namefield = "%s %s %s" % (syn['Name'],syn['Author'],syn['Year'])
                    typefield = 'authority'
                else:
                    namefield = syn['Name']
                    typefield = 'synonym'
                outstr = SYNONYM_TEMPLATE % (syn['CurrentNameID'],namefield,typefield,'')
                synonyms_file.write(outstr)
        synonyms_file.close()
    except IOError as e:
        logging.error("error %s opening/writing %s as name synonym file",str(e),synonym_fname)

BAD_SYNONYMS = []

def resolve_synonym(row,if_id_dict):
    """
    This chains back to find the taxonomically valid name for the synonym 
    in the name field of row.  Synonyms are names of rows which have
    a CurrentNameID defined and has a different value from the IF-ID.  This
    returns the IF-ID of the first row encountered in the chaining that is
    not a synonym.    
    """
    if_id = row['IF-ID']
    if if_id in BAD_SYNONYMS:
       logging.info("found bad synonym %s",if_id)
       return if_id
    current_id = row['CurrentNameID']
    while if_id != current_id:
       logging.info("in resolve synonym; current_id = %s",current_id)
       if current_id in BAD_SYNONYMS:
           logging.info("found bad synonym %s",current_id)
           return current_id
       if current_id in if_id_dict:
           new_row = if_id_dict[current_id]
           if_id = new_row['IF-ID']
           if 'CurrentNameID' in new_row:
               current_id = new_row['CurrentNameID']
           else:
               logging.info("chained synonym resolution mapped %s to unsupported id %s",row['IF-ID'],if_id)
               return if_id
       else:
           logging.info("chained id lookup failed: %s",current_id)
           return if_id
    logging.info("chained synonym resolution mapped %s to %s",row['IF-ID'],current_id)
    return current_id

           
def fill_if_dict(name_rows):
    if_dict = dict()
    for row in name_rows:
        if 'IF-ID' not in row:
            logging.info("found name row without IF-ID: %s",str(row))
        elif row['IF-ID'] in if_dict:
            logging.info("duplicate if_id found %s",str(row))
        else:
            if_dict[row['IF-ID']] = row
    return if_dict

def back_translate_name(name,name2taxon,name2synonym):
    """returns an if-id for a name"""
    if name in name2taxon:
        row = name2taxon[name]
        return row['IF-ID']
    elif name in name2synonym:
        row = name2synonym[name]
        return row['CurrentNameID']
    else:
        logging.info("Back translate failed for %s",name)
        return ''


rank_map = {"GenusName": "genus",
            "FamilyName": "family",
            "OrderName": "order",
            "SubclassName": "subclass",
            "ClassName": "class",
            "SubphylumName": "subphylum",
            "PhylumName": "phylum",
            "KingdomName": "kingdom"
            }

#temporary - should be getting this from the FDC file headers
rank_list = ["GenusName","FamilyName","OrderName","SubclassName","ClassName","SubphylumName","PhylumName","KingdomName"]
raw_rank_list = ["genus","family","order","subclass","class","subphylum","phylum","kingdom"]
rank_list_len = len(rank_list)

def get_rank(row,fdc_dict):
    name = row['Name']
    display_name = utf8e(name)
    logging.info("Looking for rank for %s",display_name)
    if ('FDC-FK' in row and row['IF-ID'] != row['FDC-FK']):
        # probably species
        if len(name.split(' ')) == 2:
            logging.info("found species %s",display_name)
            row['rank'] = 'species'
        else:  # problem, check FDC-FK
            logging.info("probably not a species")
            if row['FDC-FK'] in fdc_dict:
                hier = fdc_dict[row['FDC-FK']]
                for rank_field in rank_list:
                    if name == hier[rank_field]:
                        row['rank'] = rank_map[rank_field]
                        logging.info("found %s %s",display_name,row['rank'])
                else:               
                    if 'CurrentNameID' in row:
                       logging.info('Bad species? %s',display_name)
            else:
                fdc_list = fdc_search(name,fdc_dict)
                if len(fdc_list) > 0:
                    logging.info('found (and lost) in hard search %s',str(fdc_list))
                    if validate_lineages(name,fdc_list):
                        rank_guess = fdc_list[0][1]
                        logging.info("adding name %s with guessed rank %s",display_name,rank_guess)
                        row['rank'] = rank_guess
                else:               
                    if 'CurrentNameID' in row:
                        logging.info('Bad species? %s',display_name)
    elif ('FDC-FK' in row and row['IF-ID'] == row['FDC-FK']):
        rank_guess = 'genus'
        row['rank'] = rank_guess
        logging.info("probably a genus")
        if len(row['Name'].split(' ')) > 1:
            if 'CurrentNameID' in row:
                logging.info('Bad genus? %s',display_name)
            else:
                fdc_list = fdc_search(name,fdc_dict)
                if len(fdc_list) > 0:
                    logging.info('found in hard search %s',str(fdc_list))
                    if validate_lineages(name,fdc_list):
                        rank_guess = fdc_list[0][1]
                        logging.info("adding name %s with guessed rank %s",display_name,rank_guess)
                        row['rank'] = rank_guess
                else:               
                    if 'CurrentNameID' in row:
                        logging.warn('Bad taxon? %s',utf8e(row['Name']))
                    else:
                        logging.warn("Name without currentNameID not found %s",display_name)
    else:
        fdc_list = fdc_search(name,fdc_dict)
        if len(fdc_list) > 0:
            logging.info('found in hard search %s',str(fdc_list))
            if validate_lineages(name,fdc_list):
                rank_guess = fdc_list[0][1]
                logging.info("adding name %s with guessed rank %s",display_name,rank_guess)
                row['rank'] = rank_guess
        else:               
            if 'CurrentNameID' in row:
                logging.warn('Bad taxon? %s',display_name)
            else:
                logging.warn("Name without currentNameID not found %s",display_name)


def get_parent(row,fdc_dict,name2taxon,name2synonym):
    """
    """
    name = row['Name']
    if ('FDC-FK' in row and row['IF-ID'] != row['FDC-FK']):         # probably species
        if len(name.split(' ')) == 2:
            if row['FDC-FK'] in fdc_dict:
                parent_name = fdc_dict[row['FDC-FK']]['GenusName']
                if parent_name in name2taxon:
                    t = name2taxon[parent_name]
                    if 'IF-ID' in t:
                        parent_id = t['IF-ID']
                    else:
                        parent_id = 'not found'
                elif parent_name in name2synonym:
                    s = name2synonym[parent_name]
                    if 'CurrentNameID' in s:
                        parent_id = s['CurrentNameID']
                else:
                    parent_id = 'not found'
            else:
                logging.warn('fdc not found: %s',row['FDC-FK'])
                parent_id = 'not found'
                parent_name = 'not found'
            logging.info("found parent for species %s: %s with id %s",utf8e(name),utf8e(parent_name),utf8e(parent_id))
            row['parent'] = parent_id # 
        else:  # problem, check FDC-FK
            fdc_parent_search(row,fdc_dict,name2taxon,name2synonym)
    else:
        fdc_parent_search(row,fdc_dict,name2taxon,name2synonym)

          
def fdc_parent_search(row,fdc_dict,name2taxon,name2synonym):
    name = row['Name']
    if 'FDC-FK' in row and row['FDC-FK'] in fdc_dict:
        hier = fdc_dict[row['FDC-FK']]
        if hier['KingdomName'] == 'Fungi':
            parent_id = extract_parent(name,hier,name2taxon,name2synonym)
            row['parent'] = parent_id
        else:
            parent_id = extract_parent(name,hier,name2taxon,name2synonym)
            row['parent'] = parent_id
            #row['status'] = 'non-fungi'
            logging.info("Taxon %s is in kingdom %s, not fungi",utf8e(name),utf8e(hier['KingdomName']))
    else:
        fdc_list = fdc_search(name,fdc_dict)
        if len(fdc_list) > 0:
            fdc = fdc_list[0][0]
            hier = fdc_dict[fdc]
            parent_id = extract_parent(name,hier,name2taxon,name2synonym)
            row['parent'] = parent_id
            if hier['KingdomName'] != 'Fungi':
                logging.info("Taxon %s is in kingdom %s, not fungi",utf8e(name),utf8e(hier['KingdomName']))
        else:               
            if 'CurrentNameID' in row:
                logging.info('Bad %s %s',utf8e(row['rank']),utf8e(name))    


def extract_parent(name,hier,name2taxon,name2synonym):
    disp_name = utf8e(name)
    logging.info("extracting parent for %s",disp_name)
    parent_offset = find_immediate_parent(name,hier) 
    foo = re_search_ranks(parent_offset,hier,name2taxon,name2synonym,disp_name)
    logging.info("tried re_search_ranks for %s, got %s",disp_name,utf8e(foo))
    return foo

def find_immediate_parent(name,hier):
    for n,rank_field in enumerate(rank_list):
        if name == hier[rank_field]:
            return n+1

def re_search_ranks(parent_index,hier,name2taxon,name2synonym,disp_name):
    for sub_key in rank_list[parent_index:]:
        logging.info("sub_key is %s",sub_key)
        next_parent = hier[sub_key]
        if next_parent != 'Incertae sedis':
            parent_name = next_parent
            parent_id = back_translate_name(parent_name,name2taxon,name2synonym)
            if parent_id != '':  
                logging.info("found parent %s for non-species %s with id %s",utf8e(parent_name),disp_name,utf8e(parent_id))
                return parent_id      
            if parent_name.startswith('Fossil '):
                parent_name = parent_name[len('Fossil '):]
                parent_id = back_translate_name(parent_name,name2taxon,name2synonym)
                if parent_id != '':
                    logging.info("found parent %s for non-species %s with id %s",utf8e(parent_name),disp_name,utf8e(parent_id))
                    return parent_id
    else:
        logging.warn('failed to find parent id for %s',disp_name)
        return ''

def fdc_search(name,fdc_dict):
    result =[]
    for fdc_id in fdc_dict:
        row = fdc_dict[fdc_id]
        for rank_field in rank_map:
            if name == row[rank_field]:
                result.append((fdc_id,rank_map[rank_field]))
    return result

def init_fdc_set(fdc_dict):
    fset = set()
    for fdc_id in fdc_dict:
        for name in fdc_dict[fdc_id].values():
            fset.add(name)
    return fset

def fdc_find(name,fset):
    return name in fset


def validate_lineages(name,fdc_list):
    myrank = None
    for (id,rank) in fdc_list:
        if myrank == None:
            myrank = rank
        elif myrank != rank:
            logging.info("Inconsistant rank assigned to %s: %s and %s",utf8e(name),myrank,rank)
            return False
    else:
        return True


def get_dicts(names_file):
    result = []
    line = names_file.readline()
    keys = extract_keys(line)
    line = names_file.readline()
    while line:
       values = extract_values(line)
       d = {}
       for pair in zip(keys,extract_values(line)):
           if pair[1] != '':
               d[pair[0]] = pair[1]
       result.append(d)    
       line = names_file.readline()
    return result

def extract_keys(line):
    strings = line.split(',')
    keys = []
    for s in strings:
        s = s[1:]
        s = s.partition('"')[0]
        keys.append(s)
    return keys

def extract_values(line):
    strings = line.split('"')
    if strings[0] != '':
        prefix_ids = strings[0].split(',')
    else:
        prefix_ids = None
    strings = strings[1:]
    if prefix_ids:
        result = [prefix_ids[0]]
        if len(prefix_ids) > 2:
            result.append(prefix_ids[2])
    else:
       result = []
    string_count = len(strings)
    if string_count == 2:
        names = strings[0:1]
        ids = strings[1].split(',')[1:] 
    elif string_count == 3:
        names = strings[0:1]
        ids = strings[2].split(',')[1:]
    elif string_count > 3:
        names = strings[:-1]
        ids = strings[-1].split(',')[1:]
    else:
        logging.error("bad data row: %s",str(strings))
        return []
    for s in names:
        if s != ',':
           result.append(s.strip())
    for s in ids:
        if s != ',':
           result.append(s.strip())
    return result


def reverse_name_lookup(id,name_rows):
    for row in name_rows:
        if row['id'] == id:
            return row['name']
    return None

# Not sure this is the best way to make the
# formatting errors in log messages disappear,
# but it seems to be effective.
def utf8e(str):
    """returns utf-8 encoded string from latin-1(?) argument"""
    return codecs.encode(str,'utf-8')


if __name__ == "__main__":
    import sys
    startup(sys.argv)

