anchor_name = "collections"
title = "Lists of useful trees"
short_description = " manually curated lists of trees in phylesystem, with ranking and rationale for each choice"
long_description = "Many practical applications using OpenTree data (including [synthesis of the draft tree](http://www.biorxiv.org/content/early/2014/12/05/012260)) begin with a curated collection of trees. This is a ranked list of suitable trees, with ranking and rationale for each included tree. The code for this API is in [this Github repository](https://github.com/OpenTreeOfLife/phylesystem-api)."

methods_list = []

# find_collections
methods_list.append({
    "anchor_name" : "find_collections",
    "method_name" : "find_collections",
    "short_description" : "Return a list of collections that match a given property. If no property provided, returns a list of all collections.",
    "http_verb" : "POST",
    "relative_url" : "/collections/find_collections",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/collections/find_collections",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/collections/find_collections \\\n-H "content-type:application/json" -d \\\n'{"property":"ot:collectionId","value":"pg_719","verbose":true}'""",
    "example_result" : "",
})

# properties
methods_list.append({
    "anchor_name" : "properties",
    "method_name" : "properties",
    "short_description" : "Return a list of properties that can be used to search collections.",
    "http_verb" : "POST",
    "relative_url" : "/collections/properties",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/collections/properties",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/collections/properties""",
    "example_result" : "",
})

# collection
methods_list.append({
    "anchor_name" : "collection",
    "method_name" : "collection",
    "short_description" : "Return a collection (curated list of trees).",
    "http_verb" : "GET",
    "relative_url" : "/collection/{OWNER_ID}/{COLLECTION_NAME}",
    "example_command" : "curl http://api.opentreeoflife.org/v2/collection/cdarwin/trees-about-bees",
    "example_result" : "",
    "long_description" : """Given an OpenTree userid and "slugified" collection name, return the collection JSON.""",
    "parameters" :[]
})
