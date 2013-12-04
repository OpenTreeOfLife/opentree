# The names defined here need to match the corresponding taxa in Silva

import sys

infile = open(sys.argv[1], "r")
outfile = open(sys.argv[2], "w")

for line in infile:
	fields = line.strip().split("\t")
	# e.g. HM103894	114243
	accid = fields[0]
	taxid = fields[1]
    # e.g. 378467	|	4272	|	Platytheca galioides	|	species	|	
	outfile.write("%s\t|\t%s\t|\tseq:%s\t|\tsample\t|\t\n"%(accid,taxid,accid))

infile.close()
outfile.close()

				   
