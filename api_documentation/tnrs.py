anchor_name = "tnrs"
title = "Taxonomic name resolution services"
short_description = "methods for resolving taxonomic names to Open Tree of Life Taxonomy identifiers (ott ids)"
long_description = "Methods for resolving taxonomic names to Open Tree of Life Taxonomy identifiers (ott ids), including finding synonyms / honomyms and performing fuzzy string matching (for matching misspelled names). These methods can use information about taxonomic context to limit search scope and thereby improve performance (e.g. 'search only plants')."

methods_list = []

# match_names
methods_list.append({
    "anchor_name" : "match_names",
    "method_name" : "match_names",
    "short_description" : "Returns a list of potential matches to known taxonomic names. Currently limited to 1000 names passed in the \"names\" argument.",
    "http_verb" : "POST",
    "relative_url" : "/tnrs/match_names",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tnrs/match_names",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tnrs/match_names \\\n-H "content-type:application/json" -d \\\n'{"names":["Aster","Symphyotrichum","Erigeron","Barnadesia"]}'""",
    "example_result" : "",
})

# autocomplete_name
methods_list.append({
    "anchor_name" : "autocomplete_name",
    "method_name" : "autocomplete_name",
    "short_description" : "Given a partial (from the beginning) to complete taxonomic name, return a list of potential matches.",
    "http_verb" : "POST",
    "relative_url" : "/tnrs/autocomplete_name",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tnrs/autocomplete_name",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tnrs/autocomplete_name \\\n-H "content-type:application/json" -d \\\n'{"name":"Endoxyla","context_name":"All life"}'""",
    "example_result" : "",
})

# contexts
methods_list.append({
    "anchor_name" : "contexts",
    "method_name" : "contexts",
    "short_description" : "Return a list of pre-defined taxonomic contexts (i.e. clades), which can be used to limit the scope of tnrs queries.",
    "http_verb" : "POST",
    "relative_url" : "/tnrs/contexts",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tnrs/contexts",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tnrs/contexts""",
    "example_result" : "",
})

# infer_context
methods_list.append({
    "anchor_name" : "infer_context",
    "method_name" : "infer_context",
    "short_description" : "Return a [taxonomic context](#contexts) given a list of taxonomic names.",
    "http_verb" : "POST",
    "relative_url" : "/tnrs/infer_context",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/tnrs/infer_context",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/tnrs/infer_context \\\n-H "content-type:application/json" -d \\\n'{"names":["Pan","Homo","Mus","Bufo","Drosophila"]}'""",
    "example_result" : "",
})

