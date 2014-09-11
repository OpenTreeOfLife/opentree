anchor_name = "taxonomy"
title = "Taxonomy"
short_description = "the opentree taxonomy (OTT), which is a synthesis of different input taxonomies"
long_description = "Methods for accessing information about the current Open Tree of Life taxonomy. These methods require Open Tree of Life Taxonomy identifiers (ott ids), which can be determined using the [tnrs](#tnrs) to match against taxon names."

methods_list = []

# about
methods_list.append({
    "anchor_name" : "about_taxonomy",
    "method_name" : "about (taxonomy)",
    "short_description" : "Return information about the taxonomy, including version.",
    "http_verb" : "POST",
    "relative_url" : "/taxonomy/about",
    "neo4j_service_url" : "http://devapi.opentreeoflife.org/taxomachine/ext/taxonomy/graphdb/about",
    "example_command" : """curl -X POST http://devapi.opentreeoflife.org/v2/taxonomy/about""",
    "example_result" : "",
})

# lica
methods_list.append({
    "anchor_name" : "lica",
    "method_name" : "lica",
    "short_description" : "Given a set of ott ids, get the taxon that is the least inclusive common ancestor (the LICA) of all the identified taxa.",
    "http_verb" : "POST",
    "relative_url" : "/taxonomy/lica",
    "neo4j_service_url" : "http://devapi.opentreeoflife.org/taxomachine/ext/taxonomy/graphdb/lica",
    "example_command" : """curl -X POST http://devapi.opentreeoflife.org/v2/taxonomy/lica \\\n-H 'content-type:application/json' -d \\\n'{"ott_ids":[515698,590452,409712,643717]}'""",
    "example_result" : "",
})

# subtree
methods_list.append({
    "anchor_name" : "subtree_taxonomy",
    "method_name" : "subtree (taxonomy)",
    "short_description" : "Given an ott id, return complete taxonomy subtree descended from specified taxon.",
    "http_verb" : "POST",
    "relative_url" : "/taxonomy/subtree",
    "neo4j_service_url" : "http://devapi.opentreeoflife.org/taxomachine/ext/taxonomy/graphdb/subtree",
    "example_command" : """curl -X POST http://devapi.opentreeoflife.org/v2/taxonomy/subtree \\\n-H 'Content-type:application/json' -d '{"ott_id":515698}'""",
    "example_result" : "",
})

# taxon
methods_list.append({
    "anchor_name" : "taxon",
    "method_name" : "taxon",
    "short_description" : "Given an ott id, return information about the specified taxon.",
    "http_verb" : "POST",
    "relative_url" : "/taxonomy/taxon",
    "neo4j_service_url" : "http://devapi.opentreeoflife.org/taxomachine/ext/taxonomy/graphdb/taxon",
    "example_command" : """curl -X POST http://devapi.opentreeoflife.org/v2/taxonomy/taxon \\\n-H 'content-type:application/json' -d '{"ott_id":515698}'""",
    "example_result" : "",
})
