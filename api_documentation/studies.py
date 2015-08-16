anchor_name = "studies"
title = "Studies containing source trees"
short_description = " extracted primarily from the scientific literature, containing the source trees used to build the draft tree of life"
long_description = "Source trees are associated with studies (publications), and one study can contain multiple trees. OpenTree uses a Git repository of NexSON files as the central datastore, called [phylesystem](https://github.com/OpenTreeOfLife/phylesystem). Code for an API for the OpenTree treestore is in [this Github repository](https://github.com/OpenTreeOfLife/phylesystem-api) and there is detailed [documentation of the datastore API](https://github.com/OpenTreeOfLife/phylesystem-api/blob/master/docs/README.md). We also have a study index in neo4j that provides methods that search across studies."

methods_list = []

# find_studies
methods_list.append({
    "anchor_name" : "find_studies",
    "method_name" : "find_studies",
    "short_description" : "Return a list of studies that match a given property. If no property provided, returns a list of all studies.",
    "http_verb" : "POST",
    "relative_url" : "/studies/find_studies",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/studies/find_studies",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/studies/find_studies \\\n-H "content-type:application/json" -d \\\n'{"property":"ot:studyId","value":"pg_719","verbose":true}'""",
    "example_result" : "",
})

# find_trees
methods_list.append({
    "anchor_name" : "find_trees",
    "method_name" : "find_trees",
    "short_description" : "Return a list of trees (and the studies that contain them) that match a given property.",
    "http_verb" : "POST",
    "relative_url" : "/studies/find_trees",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/studies/find_trees",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/studies/find_trees \\\n-H "content-type:application/json" -d \\\n'{"property":"ot:ottTaxonName","value":"Garcinia"}'""",
    "example_result" : "",
})

# properties
methods_list.append({
    "anchor_name" : "properties",
    "method_name" : "properties",
    "short_description" : "Return a list of properties that can be used to search studies and trees.",
    "http_verb" : "POST",
    "relative_url" : "/studies/properties",
    "neo4j_service_url" : "http://api.opentreeoflife.org/v2/studies/properties",
    "example_command" : """curl -X POST http://api.opentreeoflife.org/v2/studies/properties""",
    "example_result" : "",
})

# study
methods_list.append({
    "anchor_name" : "study",
    "method_name" : "study",
    "short_description" : "Return a study.",
    "http_verb" : "GET",
    "relative_url" : "/study/{STUDY_ID}",
    "example_command" : "curl http://api.opentreeoflife.org/v2/study/pg_1144",
    "example_result" : "",
    "long_description" : """Given a studyID, return a JSON object. The 'data' property of that
object will hold the [NexSON](http://purl.org/opentree/nexson) of that study. 
More detailed documentation of the possible arguments and return values (including as NeXML, NEXUS, or newick) are at [phylesystem-api/docs/README.md](https://github.com/OpenTreeOfLife/phylesystem-api/blob/master/docs/README.md#fetch-a-study)""",
    "parameters" :[]
})

# tree
methods_list.append({
    "anchor_name" : "tree",
    "method_name" : "tree",
    "short_description" : "Return a tree from within a study.",
    "http_verb" : "GET",
    "relative_url" : "/study/{STUDY_ID}/tree/{TREE_ID}",
    "example_command" : "curl http://api.opentreeoflife.org/v2/study/pg_1144/tree/tree2324",
    "example_result" : "",
    "long_description" : """Given a studyID and the ID of one of its trees, return a JSON object for the tree. More detailed documentation of the possible arguments and return values (including as NEXUS or newick) are at [phylesystem-api/docs/README.md](https://github.com/OpenTreeOfLife/phylesystem-api/blob/master/docs/README.md#fine-grained-access-via-get)""",
    "parameters" : []
})
