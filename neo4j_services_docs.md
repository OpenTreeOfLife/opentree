# taxomachine
The taxonomy database of the Open Tree of Life project. Services are provided for taxonomic name resolution (TNRS), as well as direct methods of accessing the taxonomy itself. For more information on neo4j services for this database, execute this line in a terminal:

	curl -v http://dev.opentreeoflife.org/taxomachine/ 

### Available taxomachine service extensions:
#### execute_query

	http://dev.opentreeoflife.org/taxomachine/ext/CypherPlugin/graphdb/execute_query

execute a query

*	query: The query string
*	*format*: The return format. Default is Neo4j REST. Allowed: 'json-data-table' to return Google Data Table JSON.
*	*params*: The query parameters

#### execute_script

	http://dev.opentreeoflife.org/taxomachine/ext/GremlinPlugin/graphdb/execute_script

execute a Gremlin script with 'g' set to the Neo4jGraph and 'results' containing the results. Only results of one object type is supported.

*	script: The Gremlin script
*	*params*: JSON Map of additional parameters for script variables

#### contextQueryForNames

	http://dev.opentreeoflife.org/taxomachine/ext/TNRS/graphdb/contextQueryForNames

Return information on potential matches to a search query

*	*contextName*: The name of the taxonomic context to be searched
*	*idInts*: An array of ids to use for identifying names. These will be set in the id field of each name result. If this parameter is used, ids will be treated as ints.
*	*idStrings*: An array of ids to use for identifying names. These will be set in the id field of each name result. If this parameter is used, ids will be treated as strings.
*	*includeDubious*: Whether to include so-called 'dubious' taxa--those which are not accepted by OTT.
*	*names*: An array of taxon names to be queried. This is an alternative to the use of the 'queryString' parameter
*	*queryString*: A comma-delimited string of taxon names to be queried against the taxonomy db. This is an alternative to the use of the 'names' parameter

#### getContextForNames

	http://dev.opentreeoflife.org/taxomachine/ext/TNRS/graphdb/getContextForNames

Find the least inclusive taxonomic context defined for the provided set of taxon names

*	names: An array of taxon names to be queried.

#### autocompleteBoxQuery

	http://dev.opentreeoflife.org/taxomachine/ext/TNRS/graphdb/autocompleteBoxQuery

Find the least inclusive taxonomic context defined for the provided set of taxon names

*	queryString: A string containing a single name (or partial name prefix) to be queried against the db
*	*contextName*: The name of the taxonomic context to be searched

#### getContextsJSON

	http://dev.opentreeoflife.org/taxomachine/ext/TNRS/graphdb/getContextsJSON

Return information on available taxonomic contexts


#### getNodeIDJSONFromName

	http://dev.opentreeoflife.org/taxomachine/ext/GetJsons/graphdb/getNodeIDJSONFromName

Return a JSON with node ids for nodes matching a name

*	*nodename*: Name of node to find.

#### subtree

	http://dev.opentreeoflife.org/taxomachine/ext/GetJsons/graphdb/subtree

Return a taxonomy subtree for a set of taxon names

*	*query*: A CQL query string

# treemachine
The phylogeny database of the Open Tree of Life project. Services are provided for getting information about the source trees, accessing individual source trees, accessing the synthetic draft tree of life, and other various tasks. For more information on neo4j services for this database, execute this line in a terminal:

	curl -v http://dev.opentreeoflife.org/treemachine/ 

### Available treemachine service extensions:
#### execute_query

	http://dev.opentreeoflife.org/treemachine/ext/CypherPlugin/graphdb/execute_query

execute a query

*	query: The query string
*	*format*: The return format. Default is Neo4j REST. Allowed: 'json-data-table' to return Google Data Table JSON.
*	*params*: The query parameters

#### getSyntheticTree

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getSyntheticTree

Returns a synthetic tree if format is "newick" then return JSON will have two fields: newick and treeID. If format = "arguson" then the return object will be the form of JSON expected by argus

*	treeID: The identifier for the synthesis (e.g. "otol.draft.22")
*	*format*: The name of the return format (default is newick)
*	*maxDepth*: An integer controlling the max number of edges between the leaves and the node. The default is 5. A negative number corresponds to no pruning of the tree.
*	*subtreeNodeID*: The nodeid of the a node in the tree that should serve as the root of the tree returned

#### synthesizeSubtree

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/synthesizeSubtree

Initiate the default synthesis process (and store the synthesized branches) for the subgraph starting from a given root node

*	*rootottId*: The OTToL id of the node to use as the root for synthesis. If omitted then the root of all life is used.

#### getStudyIngestMessagesForNexSON

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getStudyIngestMessagesForNexSON

Return a JSON obj that represents the error and warning messages associated with attempting to ingest a NexSON blob

*	*nexsonBlob*: The OTToL id of the node to use as the root for synthesis. If omitted then the root of all life is used.

#### getSourceTree

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getSourceTree

Returns a source tree if format is "newick" then return JSON will have two fields: newick and treeID. If format = "arguson" then the return object will be the form of JSON expected by argus

*	treeID: The identifier for the source tree to return
*	*format*: The name of the return format (default is newick)
*	*maxDepth*: An integer controlling the max number of edges between the leaves and the node. The default is -1; a negative number corresponds to no pruning of the tree.
*	*subtreeNodeID*: The nodeid of the a node in the tree that should serve as the root of the tree returned

#### getDraftTreeForottId

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getDraftTreeForottId

Returns a newick string of the current draft tree (see GraphExplorer) for the node identified by `ottId`.

*	ottId: The ottol id of the taxon to be used as the root for the tree.

#### getDraftTreeForNodeID

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getDraftTreeForNodeID

returns a newick string of the current draft tree (see GraphExplorer) for the node identified by `nodeID`.

*	nodeID: The Neo4j node id of the node to be used as the root for the tree.

#### getDraftTreeChildNodesForNodeID

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getDraftTreeChildNodesForNodeID

returns the ids of the immediate SYNTHCHILDOF children of the indidcated node in the draft tree. Temporary, for interoperability testing with the arbor project.

*	nodeID: The Neo4j node id of the node to be used as the root for the tree.

#### getDraftTreeID

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getDraftTreeID

Returns identifying information for the current draft tree

*	*startingTaxonName*: The name of the intended starting taxon (default is 'life')

#### getSourceTreeIDs

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getSourceTreeIDs

Returns a list of all source tree IDs


#### getNodeIDForottId

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getNodeIDForottId

Returns the the node id of the named node identified by `ottId`.

*	ottId: The ottol id of the taxon to be used as the root for the tree.

#### getSynthesisSourceList

	http://dev.opentreeoflife.org/treemachine/ext/GoLS/graphdb/getSynthesisSourceList

Returns a list of the synthesis tree source information


#### execute_script

	http://dev.opentreeoflife.org/treemachine/ext/GremlinPlugin/graphdb/execute_script

execute a Gremlin script with 'g' set to the Neo4jGraph and 'results' containing the results. Only results of one object type is supported.

*	script: The Gremlin script
*	*params*: JSON Map of additional parameters for script variables

#### getSynthJson

	http://dev.opentreeoflife.org/treemachine/ext/GetSASJsons/graphdb/getSynthJson

Return a JSON with alternative parents presented

*	nodeID: The Neo4j node id of the node to be used as the root for the tree.

#### getTaxonJson

	http://dev.opentreeoflife.org/treemachine/ext/GetSASJsons/graphdb/getTaxonJson

Return a JSON with alternative parents presented

*	nodeID: The Neo4j node id of the node to be used as the root for the tree.

#### updateGraphFromPhylografter

	http://dev.opentreeoflife.org/treemachine/ext/PhylografterUpdater/graphdb/updateGraphFromPhylografter

Update the graph studies that should be added from phylografter


# oti
OTI is an indexing service for the NEXSoN studies available through the Open Tree of Life phylesystem. For more information on neo4j services for this database, execute this line in a terminal:

	curl -v http://dev.opentreeoflife.org/oti/ 

### Available oti service extensions:
#### execute_query

	http://dev.opentreeoflife.org/oti/ext/CypherPlugin/graphdb/execute_query

execute a query

*	query: The query string
*	*format*: The return format. Default is Neo4j REST. Allowed: 'json-data-table' to return Google Data Table JSON.
*	*params*: The query parameters

#### getSearchablePropertiesForStudies

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/getSearchablePropertiesForStudies

Get a list of properties that can be used to search for studies


#### singlePropertySearchForTreeNodes

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/singlePropertySearchForTreeNodes

Perform a simple search for trees nodes (currently only supports tip nodes) in indexed studies

*	property: The property to be searched on. A list of searchable properties is available from the getSearchablePropertiesForTrees service.
*	value: The value to be searched. This must be passed as a string, but will be converted to the datatype corresponding to the specified searchable value.
*	*exact*: Whether to perform exact matching ONLY. Defaults to false, i.e. fuzzy matching is enabled. Only applicable for some string properties.
*	*verbose*: Whether or not to include all metadata. By default, only the nexson ids of elements will be returned.

#### getSearchablePropertiesForTreeNodes

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/getSearchablePropertiesForTreeNodes

Get a list of properties that can be used to search for tree nodes


#### singlePropertySearchForStudies

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/singlePropertySearchForStudies

Perform a simple search for indexed studies

*	property: The property to be searched on. A list of searchable properties is available from the getSearchablePropertiesForStudies service.
*	value: The value to be searched. This must be passed as a string, but will be converted to the datatype corresponding to the specified searchable value.
*	*exact*: Whether to perform exact matching ONLY. Defaults to false, i.e. fuzzy matching is enabled. Only applicable for some string properties.
*	*verbose*: Whether or not to include all metadata. By default, only the nexson ids of elements will be returned.

#### findAllStudies

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/findAllStudies

Returns information about all studies in the database.

*	*includeTreeMetadata*: The property to be searched on. A list of searchable properties is available from the getSearchablePropertiesForStudies service.
*	*verbose*: Whether or not to include all metadata. By default, only the nexson ids of elements will be returned.

#### singlePropertySearchForTrees

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/singlePropertySearchForTrees

Perform a simple search for trees in indexed studies

*	property: The property to be searched on. A list of searchable properties is available from the getSearchablePropertiesForTrees service.
*	value: The value to be searched. This must be passed as a string, but will be converted to the datatype corresponding to the specified searchable value.
*	*exact*: Whether to perform exact matching ONLY. Defaults to false, i.e. fuzzy matching is enabled. Only applicable for some string properties.
*	*verbose*: Whether or not to include all metadata. By default, only the nexson ids of elements will be returned.

#### getSearchablePropertiesForTrees

	http://dev.opentreeoflife.org/oti/ext/QueryServices/graphdb/getSearchablePropertiesForTrees

Get a list of properties that can be used to search for trees


#### execute_script

	http://dev.opentreeoflife.org/oti/ext/GremlinPlugin/graphdb/execute_script

execute a Gremlin script with 'g' set to the Neo4jGraph and 'results' containing the results. Only results of one object type is supported.

*	script: The Gremlin script
*	*params*: JSON Map of additional parameters for script variables

#### unindexNexsons

	http://dev.opentreeoflife.org/oti/ext/IndexServices/graphdb/unindexNexsons

Unindex (remove) the nexson data for these study ids. If no matching study is found, do nothing. Returns arrays containing the study ids for the studies that were successfully removed from the index, and those that could not be found (and throws exceptions for those whose removal failed.

*	ids: doomed nexson ids

#### indexSingleNexson

	http://dev.opentreeoflife.org/oti/ext/IndexServices/graphdb/indexSingleNexson

DEPRECATED. Use `indexNexsons` instead. For compatibility, this *ALWAYS RETURNS* true. indexNexsons will provide more meaningful results.

*	url: remote nexson url

#### indexNexsons

	http://dev.opentreeoflife.org/oti/ext/IndexServices/graphdb/indexNexsons

Index the nexson data at the provided urls. If a nexson study to be indexed has an identical ot:studyId value to a previously indexed study, then the previous information for that study will be replaced by the incoming nexson. Returns an array containing the study ids for the studies that were successfully read and indexed.

*	urls: remote nexson urls

