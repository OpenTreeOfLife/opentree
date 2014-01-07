This is the new submission/curation tool for studies and trees in the Open Tree of Life project. Making this a separate web2py app ('curator') should make it easier to modify this separately from the main 'opentree' app.


Dependencies for external file-format conversion
================================================
To enable the conversion of external file formats to NeXSON you need to install tools
from the NEXUS class library. That is a C++ tool by Paul Lewis and Mark Holder.

See install-ncl.sh for details.

Note that the install-ncl.sh appends settings to the private/config file that controls the web2py configuration. So this script should NOT be run multiple times. 

If you do install NCL then you should have access to a web-service at .../curator/default/to_nexml

You can POST to that URL for conversion of NEXUS, newick, or NeXML to NeXSON
Required arguments:
    "uploadid" - A unique string for this upload. It needs
        to match the pattern '^[-_.a-zA-Z0-9]{5,85}$'
        clash with a previously used ID will cause data from the
        previous upload to be returned.
    "file" should be a multipart-encoded file to be translated to NexSON
Optional arguments:
    "output" one of ['ot:nexson', 'nexson', 'nexml', 'input', 'provenance']
        the default is ot:nexson. This specifies what is to be returned.
        Possible values are: 
        "ot:nexson" is the Open Tree NexSON (with character data culled).
            This should be the first call to this uploadid. Subsequent
            calls can retrieve intermediates. JSON.
        "nexson" is the complete NexSON version of the data. JSON.
        "nexml" is the NeXML version of the file. This is an intermediate
            for the NexSON. XML.
        "input" returns the uploaded file. text/plain.
        "provenance" returns a simple, ad-hoc JSON with initial call details.
    "dataDeposit" should be a URL that should be added to the meta element
        in the Open Tree NexSON object.
    "inputformat" should be "nexus", "newick", or "nexml"
        default is "nexus"

See test/test.sh for two example invocations of this web-service.