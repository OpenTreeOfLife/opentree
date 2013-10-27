
Placeholder for documentation for 'smasher', the taxonomy combiner.

Taxonomies are represented as directories, see 
https://github.com/OpenTreeOfLife/opentree/wiki/Interim-taxonomy-file-format

To test to see whether you can run Smasher, do 'make nem'.

To create a new version of OTT:

- Put previous version in tax/pre_ott/

- Edit definition of WHICH in Makefile to be new version number

- To refresh NCBI, delete tax/ncbi.  Similarly GBIF and tax/gbif
  (although I don't know whether gbif is being updated at the source
  URL where we're getting it)

- 'make'

- Result will be in tax/ott/


To make taxonomies in general:

- Run Smasher.  Command lines arguments are input taxonomies and
  operations to be performed.  See 'nem' and 'ott' targets for
  examples.  Taxonomy specifiers must end in /.  Some operations:

    --edits <dir>      specifies the location of directory full of edit files

    --ids <tax>/     specifies a taxonomy from which identifiers will be
      	  	     drawn for reuse (usually the previous version of whatever it is
      		     you're building)

   --aux <preottol>/     force generation of preottol mapping

Taxonomies can also be specified as Newick strings (not ending in /),
for testing purposes.

If you're puzzled by some decision the algorithm has made, it might be
helpful to look at the log.tsv file.