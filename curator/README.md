This is the new submission/curation tool for studies and trees in the Open Tree of Life project. Making this a separate web2py app ('curator') should make it easier to modify this separately from the main 'opentree' app.

Dependencies
============
Because of the to_nexson function, the curator currently requires the peyotl library:
 https://github.com/OpenTreeOfLife/peyotl


Dependencies for external file-format conversion
================================================
To enable the conversion of external file formats to NeXSON you need to install tools
from the NEXUS class library. That is a C++ tool by Paul Lewis and Mark Holder.

See install-ncl.sh for details.

`to_nexson` service (non-public API)
====================================
If you do install NCL then you should have access to a web-service at `.../curator/default/to_nexson`

You can POST to that URL for conversion of NEXUS, newick, or NeXML to NeXSON
Required arguments:
  * `file` should be a multipart-encoded file to be translated to NexSON, or
  * `content` which is a string that contains the content of the file format. "content" is checked if "file" is not provided.
  * 
Required arguments for subsequent invocations:
  * `uploadId` - A unique string for this upload returned as  the uploadid value in the original response. This should NOT be used in the invocation that uploads a file.

Optional arguments:
  * `output` one of ['nexson', 'nexml', 'input', 'provenance'] the default is nexson. This specifies what is to be returned. Possible values are: 
    * "nexson" is the Open Tree NexSON (with character data culled). This should be the first call to this uploadid. Subsequent calls can retrieve intermediates. JSON.
    * "nexml" is the NeXML version of the file. This is an intermediate for the NexSON. XML.
    * "input" returns the uploaded file. text/plain.
    * "provenance" returns a simple, ad-hoc JSON with initial call details.
  * `dataDeposit` should be a URL that should be added to the meta element in the Open Tree NexSON object.
  * `inputFormat` should be "nexus", "newick", or "nexml". default is "nexus"
  * `nexml2json` should be "0.0", "1.0", or "1.2". The more specific forms: "0.0.0", "1.0.0", or "1.2.1" will also work.
  * `idPrefix` should be an empty string (or all whitespace) if you want to use the firstAvailableXXXID args.       If idPrefix is not all whitespace it will be stripped, 
        the NCLconverter default names are used
      If idPrefix is not supplied, a uuid will be the prefix for the 
        names and the names will follow the NCL converter defaults. The specific ID start point args are:
    * firstAvailableEdgeID,
    * firstAvailableNodeID,
    * firstAvailableOTUID,
    * firstAvailableOTUsID,
    * firstAvailableTreeID,
    * firstAvailableTreesID

The service operates by:
  1. taking the input file and a unique string (could be a uuid).
  2. It creates a subdirectory for this upload where the subdirectory name
      is the unique uploadid and the parent is config-dependent.
  3. A simple provenance file (in JSON) is written with the original filename.
  4. The input is written to the server's filesystem in the appropriate directory.
  5. NCL's NCLconverter is used to convert it to NeXML
  6. python code converts the NeXML to NeXSON using badgerfish conventions
        but does not add any open-tree specific fields to the NexSON.
  7. some more python code converts the NeXSON to "open tree NexSON". Currently this just deletes the "characters" element and adds a dataDeposit meta element. We probably need to do more to make the rest of the open tree tools happy with this file.

The returned object (for the any ot:nexson format invocation) will have 2 keys:
  1. `data` the nexson blob, and 
  2. `uploadId` the uploadid needed for subsequent calls to get the same data or intermediates.
  3. `numberOfTrees` which is a sum over all trees elements.
  4. `dateTranslated`: "2014-02-23T05:17:12.607189", 
and several of the arguments that are sent in in the original invocation 
are echoed back, including:
    'includeNewTreesInSynthesis': true/false
    'dataDeposit': 'http://example.org', 
    'filename': 'avian_ovomucoids.tre', 
    'idPrefix': '', 
    'inputFormat': 'newick', 
    'nexml2json': '0.0.0', 
Note that even if includeNewTreesInSynthesis is True, no trees are flagged for
inclusion on the server (this is echoed back and done in the curation webapp).

Primarily for the sake of debugging, the intermediates can be fetched using the "output" argument. This can be one of: 'nexson', 'nexml', 'input', 'provenance'

See test/test.sh for two example invocations of this web-service.
