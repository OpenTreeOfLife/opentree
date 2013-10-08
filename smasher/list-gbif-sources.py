#!/usr/bin/env python

import sys,os

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print "python foo.py taxa.txt outfile"
        sys.exit(0)
    
    infile = open(sys.argv[1],"r")
    outfile = open(sys.argv[2],"w")

    # meta.xml has:
    #<field index="12" term="http://rs.tdwg.org/dwc/terms/nameAccordingTo"/>

    sources = {} 
    count = 0
    scount = 0
    for i in infile:
        spls = i.strip().split("\t")
        source = spls[12].strip()
        name = spls[4].strip()
        if (name != "") and not (source in sources):
            scount += 1
            sources[source] = name
        count += 1
        if count % 100000 == 0:
            print count, scount

    infile.close()

    for src in sources:
        outfile.write(src + "\t" + sources[src] + "\n")
    outfile.close()
