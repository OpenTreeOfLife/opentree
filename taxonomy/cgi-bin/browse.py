#!/usr/bin/python

# Brutally primitive reference taxonomy browser.
# Basically just a simple shim on the taxomachine 'taxon' method.
# Intended to be run as a CGI command, but it can be tested by running it 
# directly from the shell; just set the environment QUERY_STRING to be
# the name or id of the taxon to browse to.

# Apache (or other server) must be configured to be able to run CGI scripts, 
# and this program must be in the directory where it looks for such scripts.
# The file name there should be simply 'browse' (not browse.py).

# NOT YET IMPLEMENTED: percent-escaping and -unescaping

# If this were to be written using peyotl, it might do something similar to the following:
# from peyotl.api import APIWrapper
# taxo = APIWrapper().taxomachine
# print taxo.taxon(12345)

default_api_base_url = 'https://devapi.opentreeoflife.org/'

import os
import sys
import cgi, cgitb, StringIO

import requests
import simplejson

headers = {
    'content-type' : 'application/json',
    'accept' : 'application/json',
}

# Main entry point.  Returns HTML as a string.

def browse(id=None, name=None, limit=None, api_base=None):
    if id != None: id = int(id)
    if limit != None: limit = int(limit)
    if api_base == None: api_base = default_api_base_url

    output = StringIO.StringIO()
    #output.write('<pre>\n')
    if id != None:
        browse_by_id(id, limit, api_base, output)
    elif name != None:
        browse_by_name(name, limit, api_base, output)
    else:
        output.write('bogus invocation\n')
    #output.write('</pre>\n')

    return output.getvalue()

def browse_by_name(name, limit, api_base, output):
    result = look_up_name(name, api_base)
    matches = result[u'matches']
    if len(matches) == 0:
        output.write('no TNRS matches for %s\n' % cgi.escape(name))
        return None
    elif len(matches) > 1:
        output.write('Matches for %s: \n' % cgi.escape(name))
        for match in matches:
            output.write("  %s\n" % link_to_taxon(match[u'ot:ottId'], match[u'unique_name']))
    else:
        id = matches[0][u'ot:ottId']
        browse_by_id(id, limit, api_base, output)

# Map taxon name to taxonomy id using match_names service

def look_up_name(name, api_base):
    response = requests.post(api_base + 'v2/tnrs/match_names',
                             headers=headers,
                             data=simplejson.dumps({'names':[name]}))
    response.raise_for_status()
    answer = response.json()
    results = answer[u'results']
    if len(results) == 0: return None
    if len(results) > 1:
        output.write('multiple results - should not happen\n')
        return None # shouldn't happen
    return results[0]

def browse_by_id(id, limit, api_base, output):
    info = get_taxon_info(id, api_base)
    #print simplejson.dumps(info, sort_keys=True, indent=4)
    display_taxon_info(info, limit, output)

def get_taxon_info(ottid, api_base):
    d=simplejson.dumps({'ott_id': ottid, 'include_children': True, 'include_lineage': True})
    response = requests.post(api_base + 'v2/taxonomy/taxon',
                             headers=headers,
                             data=d)
    response.raise_for_status()
    return response.json()

def display_taxon_info(info, limit, output):
    if u'ot:ottId' in info:
        id = info[u'ot:ottId']
        start_el(output, 'p', 'taxon')
        output.write('Taxon: ')
        display_basic_info(info, output)
        output.write(' (OTT id %s)' % id)
        end_el(output, 'p')

        if u'synonyms' in info:
            synonyms = info[u'synonyms']
            name = info[u'ot:ottTaxonName']
            if name in synonyms:
                synonyms.remove(name)
            if len(synonyms) > 0:
                start_el(output, 'p', 'synonyms')
                output.write("Synonym(s): %s\n" % ', '.join(map(link_to_name, synonyms)))
                end_el(output, 'p')
        if u'taxonomic_lineage' in info:
            first = True
            start_el(output, 'p', 'lineage')
            output.write('Lineage: ')
            for ancestor in info[u'taxonomic_lineage']:
                if not first:
                    output.write(' &lt; ')
                output.write(link_to_taxon(ancestor[u'ot:ottId'], ancestor[u'ot:ottTaxonName']))
                first = False
            output.write('\n')
            end_el(output, 'p')
        else:
            output.write('missing lineage field %s\n', info.keys())
        any_suppressed = False
        if u'children' in info:
            children = sorted(info[u'children'], key=priority)
            if len(children) > 0:
                start_el(output, 'p', 'children')
                output.write('Children:\n')
                if limit == None: limit = 200
                start_el(output, 'ul', 'children')
                for child in children[:limit]:
                    if ishidden(child):
                        start_el(output, 'li', 'child suppressed')
                        write_suppressed(output)
                        any_suppressed = True
                    else:
                        start_el(output, 'li', 'child exposed')
                        start_el(output, 'span', 'exposedmarker')
                        output.write("  ")
                        end_el(output, 'span')
                    output.write(' ')
                    display_basic_info(child, output)
                    end_el(output, 'li')
                if len(children) > limit:
                    start_el(output, 'li', 'more_children')
                    output.write('... %s' % link_to_taxon(id,
                                                          ('%s more children' %
                                                           (len(children)-limit)),
                                                          limit=100000))
                    end_el(output, 'li')
                end_el(output, 'ul')
                end_el(output, 'p')
        output.write("\n")
        if any_suppressed:
            start_el(output, 'p', 'footer suppressed')
            output.write("'")
            write_suppressed(output)
            output.write("' = suppressed from synthetic tree\n")
            end_el(output, 'p')
        start_el(output, 'p', 'footer flags')
        output.write('<a href="https://github.com/OpenTreeOfLife/reference-taxonomy/wiki/Taxon-flags">explanation of flags</a>\n')
        end_el(output, 'p')
    else:
        output.write('? losing')
        output.write(cgi.escape(simplejson.dumps(info, sort_keys=True, indent=4)))

def write_suppressed(output):
    start_el(output, 'span', 'suppressedmarker')
    output.write("*")
    end_el(output, 'span')

def display_basic_info(info, output):
    # Might be better to put rank as a separate column in a table.  That way the
    # names will line up
    if not info[u'rank'].startswith('no rank'):
        output.write(info[u'rank'] + ' ')

    # Taxon name
    if u'unique_name' in info and len(info[u'unique_name']) > 0:
        text = info[u'unique_name']
    elif u'ot:ottTaxonName' in info:
        text = info[u'ot:ottTaxonName']
    output.write(link_to_taxon(info[u'ot:ottId'], text))

    # Sources
    start_el(output, 'span', 'sources')
    if u'tax_sources' in info:
        output.write(' %s ' % ', '.join(map(source_link, info[u'tax_sources'])))
    end_el(output, 'span')

    # Flags
    start_el(output, 'span', 'flags')
    output.write('%s ' % ', '.join(map(lambda f:f.lower(), info[u'flags'])))
    end_el(output, 'span')
    output.write('\n')

def source_link(source_id):
    if source_id.startswith('http:') or source_id.startswith('https:'):
        url = source_id
    else:
        parts = source_id.split(':')
        url = None
        if len(parts) == 2:
            if parts[0] == 'ncbi':
                url = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=%s' % parts[1]
            elif parts[0] == 'gbif':
                url = 'http://www.gbif.org/species/%s/' % parts[1]
            elif parts[0] == 'irmng':
                url = 'http://www.marine.csiro.au/mirrorsearch/ir_search.taxon_info?id=%s' % parts[1]
            elif parts[0] == 'if':
                url = 'http://www.indexfungorum.org/names/NamesRecord.asp?RecordID=%s' % parts[1]
            elif parts[0] == 'worms':
                url = 'http://www.marinespecies.org/aphia.php?p=taxdetails&id=%s' % parts[1]
            elif parts[0] == 'silva':
                url = 'http://www.arb-silva.de/browser/ssu/silva/%s' % parts[1]
    if url != None:
        return '<a href="%s">%s</a>' % (cgi.escape(url), cgi.escape(source_id))
    else:
        return source_id

def start_el(output, tag, clas=''):
    output.write('<%s class="%s">' % (tag, clas))
def end_el(output, tag):
    output.write('</%s>' % tag)

def link_to_taxon(id, text, limit=None):
    if limit == None:
        option = ''
    else:
        option = '&limit=%s' % limit
    return '<a href="browse?id=%s%s">%s</a>' % (id, option, style_name(cgi.escape(text)))

def link_to_name(name):
    name = cgi.escape(name)
    return '<a href="browse?name=%s">%s</a>' % (name, style_name(name))

def style_name(ename):
    return '<span class="name">%s</span>' % ename

def priority(child):
    if ishidden(child):
        return 1
    else:
        return 0

def ishidden(info):
    for flag in info[u'flags']:
        if flag in ott29_exclude_flags:
            return True
    return False

# From treemachine/src/main/java/opentree/GraphInitializer.java

ott29_exclude_flags_list = ["major_rank_conflict", "major_rank_conflict_inherited", "environmental",
		"unclassified_inherited", "unclassified", "viral", "barren", "not_otu", "incertae_sedis",
		"incertae_sedis_inherited", "extinct_inherited", "extinct", "hidden", "unplaced", "unplaced_inherited",
		"was_container", "inconsistent", "inconsistent", "hybrid", "merged", "inconsistent"]
ott29_exclude_flags = {}
for flag in ott29_exclude_flags_list:
    ott29_exclude_flags[flag.upper()] = True

if __name__ == '__main__':
    form = cgi.FieldStorage()
    id = name = limit = api_base = None
    if "id" in form: id = form["id"].value
    if "name" in form: name = form["name"].value
    if "limit" in form: limit = form["limit"].value
    if "api_base" in form: api_base = form["api_base"].value
    print 'Content-type: text/html'
    print
    output = sys.stdout
    start_el(output, 'html')
    start_el(output, 'head', '')
    output.write('<link rel="stylesheet" href="http://opentreeoflife.github.io/css/main.css" />')
    end_el(output, 'head')
    start_el(output, 'body')
    print browse(id, name, limit, api_base)
    end_el(output, 'body')
    end_el(output, 'html')
