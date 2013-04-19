
# Intended to be applied to preOTToL_20121112.txt

# 100000008	101607385	U4_4-29445	Mesomorphus	Mesomorphus	genus	2011-05-10 16:48:19 UTC
# 0             1               2               3               4               5       6

import sys

infile = open(sys.argv[1],"r")
outfile = open(sys.argv[2],"w")
for row in infile:
    fields = row.strip().split("\t")
    num = fields[0].strip()
    pnum = fields[1].strip()
    name = fields[3].strip()
    rank = fields[5].strip()
    outfile.write(num+"\t|\t"+pnum+"\t|\t"+name+"\t|\t"+rank+"\t|\t\n")
infile.close()
outfile.close()
