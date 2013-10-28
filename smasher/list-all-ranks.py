#!/usr/bin/env python

import sys,os

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print "python foo.py taxonomy.tsv"
        sys.exit(0)
    
    infile = open(sys.argv[1],"r")

    ranks = {} 
    count = 0
    scount = 0
    for i in infile:
        if count == 0:
            count += 1
            continue
        spls = i.strip().split("\t")
        rank = spls[6].strip()
        if (rank != "") and not (rank in ranks):
            scount += 1
            ranks[rank] = True
        count += 1
        if count % 100000 == 0:
            print count, scount

    infile.close()

    for rank in ranks:
        print rank
