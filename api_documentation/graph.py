anchor_name = "graph"
title = "Graph of life"
short_description = "the neo4j graph database used to build the synthetic tree; contains additional nodes and edges (from taxonomy & source trees) that are not in the synthetic tree"
long_description = "When we construct the tree of life, we load the taxonomy and input trees (a subset of the trees in the study database) into a neo4j graph database. Due to conflict between trees and taxonomy and the fact that the tree of life is binary, the graph contains nodes and edges not in the tree of life. These methods access the full graph database."

methods_list = []

# about
methods_list.append({
    "anchor_name" : "about_graph",
    "method_name" : "about",
    "short_description" : "Get information about the graph of life itself.",
    "http_verb" : "POST",
    "relative_url" : "/graph/about",
    "neo4j_service_url" : "https://api.opentreeoflife.org/v2/graph/about",
    "example_command" : """curl -X POST https://api.opentreeoflife.org/v2/graph/about""",
    "example_result" : "",
})

# source_tree
methods_list.append({
    "anchor_name" : "source_tree",
    "method_name" : "source_tree",
    "deprecated": True,
    "short_description": "Source trees used in synthesis are currently only available by a download",
    "further_info": ({'url': "https://files.opentreeoflife.org/preprocessed/v3.0/", 
                      'link_name': 'Page with the download links'},
                     {'url': "https://github.com/OpenTreeOfLife/treemachine/issues/170", 
                      'link_name': "GitHub issue describing decision to deprecate this service"},
                    ),
    #"short_description" : "Return a source tree (including metadata) from the graph of life.",
    #"http_verb" : "POST",
    "relative_url" : "/graph/source_tree",
    #"neo4j_service_url" : "http://api.opentreeoflife.org/v2/graph/source_tree",
    #"example_command" : """curl -X POST http://api.opentreeoflife.org/v2/graph/source_tree -H "content-type:application/json" -d '{"study_id":"pg_420", "tree_id":"522", "git_sha":"a2c48df995ddc9fd208986c3d4225112550c8452"}'""",
    #"example_result" : "",
})

# node_info
methods_list.append({
    "anchor_name" : "node_info",
    "method_name" : "node_info",
    "short_description" : "Get information about a node in the graph of life.",
    "http_verb" : "POST",
    "relative_url" : "/graph/node_info",
    "neo4j_service_url" : "https://api.opentreeoflife.org/v2/graph/node_info",
    "example_command" : """curl -X POST https://api.opentreeoflife.org/v2/graph/node_info -H "content-type:application/json" -d '{"ott_id":810751}'""",
    "example_result" : "",
})
