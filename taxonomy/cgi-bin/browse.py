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
    output = StringIO.StringIO()
    try:
        if id != None: id = int(id)
    except ValueError:
        report_invalid_arg(output, "Argument 'id' should be an integer!")
        return output.getvalue()
    try:
        if limit != None: limit = int(limit)
    except ValueError:
        report_invalid_arg(output, "Argument 'limit' should be an integer!")
        return output.getvalue()
    if api_base == None: api_base = default_api_base_url

    if id != None:
        browse_by_id(id, limit, api_base, output)
    elif name is None:
        # bump them to our default taxon (root of synthetic tree)
        browse_by_name('cellular organisms', limit, api_base, output)
    else:
        browse_by_name(name, limit, api_base, output)

    return output.getvalue()

def report_invalid_arg(output, info):
    start_el(output, 'h1')
    output.write('Open Tree taxonomy: <strong class="error">invalid argument</strong>')
    end_el(output, 'h1')
    output.write('<p class="error">There was a problem with the name or ID provided:</p>\n')
    start_el(output, 'pre', 'error')
    output.write(cgi.escape(simplejson.dumps(info, sort_keys=True, indent=4)))
    end_el(output, 'pre')

def browse_by_name(name, limit, api_base, output):
    result = look_up_name(name, api_base)
    if result is None:
        report_invalid_arg(output, "No taxa found matching name '%s'" % name)
        return None
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
    included_children_output = StringIO.StringIO()
    suppressed_children_output = StringIO.StringIO()
    if u'ot:ottId' in info:
        id = info[u'ot:ottId']
        start_el(output, 'h1')
        output.write('Open Tree taxonomy: <strong>%s</strong>' % get_display_name(info))
        end_el(output, 'h1')

        start_el(output, 'p', 'legend')
        output.write('See the OTT wiki for <a href="https://github.com/OpenTreeOfLife/reference-taxonomy/wiki/Taxon-flags">an explanation of the taxon flags used</a> below, e.g., <span class="flag">extinct</span>\n')
        end_el(output, 'p')

        output.write('<h3>Taxon details</h3>')
        start_el(output, 'p', 'taxon')
        display_basic_info(info, output)
        output.write(' (OTT id %s)' % id)
        synth_tree_url = "/opentree/ottol@%s" % id
        output.write('  <a target="_blank" href="%s">view in latest synthetic tree</a>' % cgi.escape(synth_tree_url))
        end_el(output, 'p')

        if u'synonyms' in info:
            synonyms = info[u'synonyms']
            name = info[u'ot:ottTaxonName']
            if name in synonyms:
                synonyms.remove(name)
            if len(synonyms) > 0:
                output.write('<h3>Synonym(s)</h3>')
                start_el(output, 'p', 'synonyms')
                output.write("%s\n" % ', '.join(map(link_to_name, synonyms)))
                end_el(output, 'p')
        if u'taxonomic_lineage' in info:
            first = True
            output.write('<h3>Lineage</h3>')
            start_el(output, 'p', 'lineage')
            # N.B. we reverse the list order to show the root first!
            if info[u'taxonomic_lineage']:
                info[u'taxonomic_lineage'].reverse()
            for ancestor in info[u'taxonomic_lineage']:
                if not first:
                    output.write(' &gt; ')
                output.write(link_to_taxon(ancestor[u'ot:ottId'], ancestor[u'ot:ottTaxonName']))
                first = False
            output.write('\n')
            end_el(output, 'p')
        else:
            output.write('missing lineage field %s\n', info.keys())
        any_included = False
        any_suppressed = False
        if limit == None: limit = 200
        if u'children' in info:
            children = sorted(info[u'children'], key=priority)
            if len(children) > 0:

                # Generate initial output for two lists of children
                suppressed_children_output.write('<h3>Children suppressed from the synthetic tree</h3>')
                start_el(suppressed_children_output, 'ul', 'children')
                nth_suppressed_child = 0
                included_children_output.write('<h3>Children included in the synthetic tree</h3>')
                start_el(included_children_output, 'ul', 'children')
                nth_included_child = 0

                for child in children[:limit]:
                    if ishidden(child):
                        nth_suppressed_child += 1
                        odd_or_even = (nth_suppressed_child % 2) and 'odd' or 'even'
                        start_el(suppressed_children_output, 'li', 'child suppressed %s' % odd_or_even)
                        #write_suppressed(suppressed_children_output)
                        suppressed_children_output.write(' ')
                        display_basic_info(child, suppressed_children_output)
                        end_el(suppressed_children_output, 'li')
                        any_suppressed = True
                    else:
                        nth_included_child += 1
                        odd_or_even = (nth_included_child % 2) and 'odd' or 'even'
                        start_el(included_children_output, 'li', 'child exposed %s' % odd_or_even)
                        start_el(included_children_output, 'span', 'exposedmarker')
                        included_children_output.write("  ")
                        end_el(included_children_output, 'span')
                        included_children_output.write(' ')
                        display_basic_info(child, included_children_output)
                        end_el(included_children_output, 'li')
                        any_included = True

                end_el(suppressed_children_output, 'ul')
                end_el(included_children_output, 'ul')
        if any_included:
            output.write(included_children_output.getvalue())
        if any_suppressed:
            output.write(suppressed_children_output.getvalue())
        if u'children' in info:
            children = info[u'children']
            if children != None and len(children) > limit:
                start_el(output, 'p', 'more_children')
                output.write('... %s' % link_to_taxon(id,
                                                      ('%s more children' %
                                                       (len(children)-limit)),
                                                      limit=100000))
                end_el(output, 'p')
        output.write("\n")
    else:
        report_invalid_arg(output, info)

def write_suppressed(output):
    start_el(output, 'span', 'suppressedmarker')
    output.write("*")
    end_el(output, 'span')

def get_display_name(info):
    if u'unique_name' in info and len(info[u'unique_name']) > 0:
        return info[u'unique_name']
    elif u'ot:ottTaxonName' in info:
        return info[u'ot:ottTaxonName']
    return u'Unnamed taxon'

def display_basic_info(info, output):
    # Might be better to put rank as a separate column in a table.  That way the
    # names will line up
    if not info[u'rank'].startswith('no rank'):
        output.write(info[u'rank'] + ' ')

    # Taxon name
    output.write(link_to_taxon(info[u'ot:ottId'], get_display_name(info)))

    # Sources
    start_el(output, 'span', 'sources')
    if u'tax_sources' in info:
        output.write(' %s ' % ', '.join(map(source_link, info[u'tax_sources'])))
    end_el(output, 'span')

    # Flags
    start_el(output, 'span', 'flags')
    output.write('%s ' % ', '.join(map(lambda f:'<span class="flag">%s</span>' % f.lower(), info[u'flags'])))
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

local_stylesheet = """
  <style type="text/css">
    h1 {
        color: #999;
        /* indent multi-line heading (a very long taxon name) */
        padding-left: 55px;
        text-indent: -25px;
        /* maintain pleasing placement of Open Tree logo */
        height: auto;
        padding-top: 0.35em;
        line-height: 1.0em;
        min-height: 32px;
        background-position: left 5px;
    }
    h1 strong {
        color: #000;
    }
    h3 {
        margin-bottom: 0.3em;
    }
    .legend {
        font-style: italic;
    }
    .legend .flag {
        font-style: normal;
    }
    .error {
        color: #933;
    }
    h4,
    p.taxon,
    p.synonyms,
    p.lineage,
    ul.children {
        margin-top: 0.25em;
        margin-left: 2em;
    }
    ul.children {
        padding-left: 0;
    }
    ul.children li {
        list-style: none;
        padding: 0.25em;
        /* align text with other details; pad for bg color and indent second line */
        margin-left: -0.5em;
        padding-left: 2.5em;
        text-indent: -2em;
    }
    li.odd {
        background-color: #fff;
    }
    li.even {
        background-color: #f5f5f5;
    }
    span.name {
        font-weight: bold;
    }
    span.flags {
        padding-left: 1em;
    }
    span.flag {
        font-family: monospace;
        color: #999;
    }
  </style>
"""

if __name__ == '__main__':
    form = cgi.FieldStorage()
    id = name = limit = api_base = None
    if "id" in form: id = form["id"].value
    if "name" in form: name = form["name"].value
    if "limit" in form: limit = form["limit"].value
    if "api_base" in form: api_base = form["api_base"].value
    # Content-type information is not helpful in our current setup?
    sys.stdout.write('Content-type: text/html; charset=utf8\r\n')
    sys.stdout.write('\r\n')
    output = sys.stdout
    start_el(output, 'html')
    start_el(output, 'head', '')
    output.write('<link rel="stylesheet" href="//opentreeoflife.github.io/css/main.css" />')
    output.write(local_stylesheet)
    end_el(output, 'head')
    start_el(output, 'body')
    print browse(id, name, limit, api_base).encode('utf-8')
    end_el(output, 'body')
    end_el(output, 'html')
