anchor_name = "tree_of_life"
title = "Tree of life"
short_description = "the single draft tree of life that is a combination of the source trees and the opentree reference taxonomy"
long_description = """Methods to access information about and representations of the (current) draft tree of life. These methods do not accept taxon names as input, but instead require either:
- Open Tree Taxonomy identifiers (ott ids), which can be determined by using the [taxonomic name resolution services](#tnrs), or
- Graph of life node ids, which can be determined using various methods such as [mrca](#mrca).

Detailed descriptions for each method follow below the summary table."""

methods_list = []

# about
methods_list.append({
    "anchor_name" : "about_tree",
    "method_name" : "about (tree of life)",
    "short_description" : "Return information about the current draft tree itself.",
    "http_verb" : "POST",
    "relative_url" : "/tree_of_life/about",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tree_of_life/about",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tree_of_life/about -H "content-type:application/json"  -d '{"study_list":false}'
""",
    "example_result" : "",
})

# mrca
methods_list.append({
    "anchor_name" : "mrca",
    "method_name" : "mrca",
    "short_description" : "Return the most recent common ancestor of a set of nodes in the draft tree.",
    "http_verb" : "POST",
    "relative_url" : "/tree_of_life/mrca",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tree_of_life/mrca",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tree_of_life/mrca -H "content-type:application/json" -d '{"ott_ids":[412129, 536234]}'""",
    "example_result" : "",
})

# subtree
methods_list.append({
    "anchor_name" : "subtree_tree",
    "method_name" : "subtree (tree of life)",
    "short_description" : "Return the complete subtree below a given node.",
    "http_verb" : "POST",
    "relative_url" : "/tree_of_life/subtree",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tree_of_life/subtree",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tree_of_life/subtree -H "content-type:application/json" -d '{"ott_id":3599390}'""",
    "example_result" : "",
})

# induced_subtree
methods_list.append({
    "anchor_name" : "induced_subtree",
    "method_name" : "induced_subtree",
    "short_description" : "Return the induced subtree on the draft tree that relates a set of nodes.",
    "http_verb" : "POST",
    "relative_url" : "/tree_of_life/induced_subtree",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tree_of_life/induced_subtree",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tree_of_life/induced_subtree -H "content-type:application/json" -d '{"ott_ids":[292466, 501678, 267845, 666104, 316878, 102710, 176458]}'""",
    "example_result" : "",
})
