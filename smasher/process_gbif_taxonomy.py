#!/usr/bin/env python

import sys,os
from collections import Counter

"""
ignore.txt should include a list of ids to ignore, all of their children
should also be ignored but do not need to be listed
"""

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print "python process_ottol_taxonomy.py taxa.txt ignore.txt outfile"
        sys.exit(0)
    
    infile = open(sys.argv[1],"r")
    infile2 = open(sys.argv[2],"r")
    ignore = []
    for i in infile2:
        ignore.append(i.strip())
    outfile = open(sys.argv[3],"w")
    outfilesy = open(sys.argv[3]+".synonyms","w")
    names = [] 
    parents = []    #list of ids
    count = 0
    skipcount = 0
    pid ={} #parent ids key is the id and the value is the parent
    cid ={} #child ids key is the id and the value is the children
    nm_storage = {} # storing the id and the name
    nrank = {}
    synnames = {}
    syntargets = {}
    syntypes = {}
    irmnghoms = {}
    print "count skipped"
    for i in infile:
        spls = i.strip().split("\t")
        # For information on what information is in each column see
        # meta.xml in the gbif distribution.
        num = spls[0].strip()
        if not num.isdigit():
            # Header line has "taxonID" here
            continue
        if "IRMNG Homonym" in i:
            irmnghoms[num] = True
        if "International Plant Names Index" in i:
            skipcount += 1
            continue
        # "unclassified" doesn't occur 2013-07-02
        # "unassigned" doesn't occur 2013-07-02
        # "other" never occurs as a word
        # there are two "artificial" but they look OK
        # there is one "insertion" and it looks OK
        #if "unclassified" in i or "unassigned" in i or "other" in i or "artificial" in i or "insertion" in i:
        #    skipcount += 1
        #    continue
        if num == "0":
            continue #gbif incertae sedis
        pnum = spls[1].strip()  # parent number
        if pnum == "0":
            continue
        name = spls[4].strip()
        rank = spls[5].strip()
        if rank == "form" or rank == "variety" or rank == "subspecies" or rank == "infraspecificname":
            continue
        if rank == "kingdom":
            pnum = "0"
        acc = spls[6].strip()
        if acc != "accepted":
            skipcount += 1
            synnames[num] = name
            syntargets[num] = spls[2].strip()
            syntypes[num] = acc
            continue
        if len(pnum) == 0 or len(num) == 0 or len(name) == 0:
            skipcount += 1
            continue
        nrank[num] = rank
        if len(pnum) > 0:
            pid[num] = pnum
        nm_storage[num] = name
        if pnum not in cid:
            cid[pnum] = []
        cid[pnum].append(num)
        parents.append(pnum)
        names.append(name)
        count += 1
        if count % 100000 == 0:
            print count,skipcount

    infile.close()

    print "counting"
    b  = Counter(names)
    # 2013-07-02 dnames is unused
    dnames = []
    for i in b:
        if b[i] > 1:
            dnames.append(i)
    names = []  #GC

    b = Counter(parents)
    dparents = []
    dparents = b.keys()
    parents = []

    print "getting the parent child duplicates fixed"
    ignoreid = []
    for i in nm_storage:
        if i in pid and pid[i] in nm_storage:
            if nm_storage[i] == nm_storage[pid[i]]:
#                print i,nm_storage[i],nrank[i],pid[i],nm_storage[pid[i]],nrank[pid[i]]
#                sys.exit(0)
#                if nrank[i] == nrank[pid[i]]:
                if i in cid:     # If it has children,
                    idstoch = cid[i]
                    for j in idstoch:
                        pid[j] = pid[i]
                ignoreid.append(i)
    for i in ignoreid:
        del nm_storage[i]

    # Flush taxa from the IRMNG homonym list that don't have children
    count = 0
    for num in irmnghoms:
        if not num in cid:
            if num in nm_storage:
                del nm_storage[num]
            count += 1
    print "IRMNG homonyms deleted:", count

    #putting parentless taxa into the ignore list
    count = 0
    for i in nm_storage:
        if pid[i] not in nm_storage:
            count += 1
            if pid[i] != "0":
                ignore.append(i)
                if count % 3000 == 0:
                    print "example orphan ",i,nm_storage[i]
            else:
                print "top level ",i,nm_storage[i]
    print "orphans: ", len(ignore)

    #now making sure that the taxonomy is functional before printing to the file
    print "checking the tree structure"
    skipids = {}
    stack = ignore
    while len(stack) != 0:
        curid = stack.pop()
        if curid in skipids:
            continue
        skipids[curid] = True
        if curid in cid:
            ids = cid[curid]
            for i in ids:
                stack.append(i)

    for i in skipids:
        if i in nm_storage:
            del nm_storage[i]

    """
    output the id parentid name rank
    """
    print "done counting"
    count = 0
    for i in nm_storage:
        #spls = i.strip().split("\t")
        #num = spls[0]
        num = i
#        if num in ignoreid:
#            print "ignoring ",num
#            continue
        #pnum = spls[1]
        if i in pid:
            pnum = pid[i]
        else:
            pnum = ""
        #name = spls[3]
        name = nm_storage[i]
 #       if spls[3] == "Unassigned":
 #           name = spls[4]
        if name in dnames:
            #if num in dparents:
	    #may need to add this back for null parents
            outfile.write(num+"\t|\t"+pnum+"\t|\t"+name+"\t|\t"+nrank[i]+"\t|\t\n")
        else:
            outfile.write(num+"\t|\t"+pnum+"\t|\t"+name+"\t|\t"+nrank[i]+"\t|\t\n")
        count += 1
        if count % 100000 == 0:
            print count
    outfile.write("0\t|\t\t|\tlife\t|\t\t|\t\n")
    outfile.close()

    print "synonyms"
    for num in synnames:
        target = syntargets[num]
        if target in nm_storage:
            outfilesy.write(target+"\t|\t"+synnames[num]+"\t|\t"+syntypes[num]+"\t|\t\n")
    outfilesy.close()
