#!/usr/bin/env python

import sys,os,sqlite3
import os.path
from collections import Counter

"""
this processes the ncbi taxonomy tables for the synonyms and the 
names that will be included in the upload to the taxomachine
"""

"""
skipping
- X 
-environmental
-unknown
-unidentified
-endophyte
-uncultured
-scgc
-libraries
-unclassifed

if it is a series based on names 3rd column
adding series to the name

connecting these to there parents
-unclassified
-incertae sedis
"""

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print "python process_ncbi_taxonomy_taxdump.py download[T|F] skipids.file outfile"
        sys.exit(0)
    download = sys.argv[1]
    outfile = open(sys.argv[3],"w")
    outfilesy = open(sys.argv[3]+".synonyms","w")
    if download.upper() == "T":
        print("downloading taxonomy")
        os.system("wget ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz")
        os.system("tar -xzvf taxdump.tar.gz")

    if os.path.isfile("nodes.dmp") == False:
        print "nodes.dmp is not present"
        sys.exit(0)
    if os.path.isfile("names.dmp") == False:
        print "names.dmp is not present"
        sys.exit(0)

    nodesf = open("nodes.dmp","r")
    namesf = open("names.dmp","r")

    count = 0
    pid = {} #key is the child id and the value is the parent
    cid = {} #key is the parent and value is the list of children
    nrank = {} #key is the node id and the value is the rank
    for i in nodesf:
        spls = i.split("\t|\t")
        tid = spls[0].strip()
        parentid = spls[1].strip()
        rank = spls[2].strip()
        pid[tid] = parentid
        nrank[tid] = rank
        if parentid not in cid: 
            cid[parentid] = []
        cid[parentid].append(tid)
        count += 1
        if count % 100000 == 0:
            print count
    nodesf.close()

    skip = ["viral","unclassified","other","viroids","viruses","artificial","x","environmental","unknown","unidentified","endophyte","endophytic","uncultured","scgc","libraries","virus"]
    skipids = []
    #run through the skip ids file
    skipidf = open(sys.argv[2],"r")
    for i in skipidf:
    	skipids.append(i.strip())
    skipidf.close()
    
    count = 0
    classes = []
    idstoexclude = []
    nm_storage = {}
    lines = {}
    synonyms = {}
    namesd = []
    allnames = []
    for i in namesf:
        spls = i.strip().split("\t|") #if you do \t|\t then you don't get the name class right because it is "\t|"
        gid = spls[0].strip()
        par = pid[gid]
        nm = spls[1].strip()
        homonc = spls[2].strip() #can get if it is a series here
        nm_c = spls[3].strip()
        if nm_c not in classes:
            classes.append(nm_c)
        nm_keep = True
        nms = nm.split(" ")
        for j in nms:
            if j.lower() in skip:
                nm_keep = False
        if gid in skipids:
        	nm_keep = False
        if nm_keep == False:
            idstoexclude.append(gid)
            continue
        if "<series>" in homonc:
            nm = nm + " series"
        if "subgroup <" in homonc: #corrects some nested homonyms
            nm = homonc.replace("<","").replace(">","")
        if nm_c != "scientific name":
            if gid not in synonyms:
                synonyms[gid] = []
            synonyms[gid].append(i.strip())
        else:
            lines[gid] = i.strip()
            nm_storage[gid] = nm
            allnames.append(nm)
        count += 1
        if count % 100000 == 0:
            print count
    print "number of lines: ",count
    namesf.close()

    #get the nameids that are double
    c = Counter(allnames)
    namesd = []
    for i in c:
        if c[i] > 1:
            namesd.append(i)
    ndoubles = []
    namesf = open("names.dmp","r")
    for i in namesf:
        spls = i.strip().split("\t|") #IF YOU DO \T|\T THEN YOU DON'T GET THE NAME CLASS RIGHT BECAUSE IT IS "\T|"
        gid = spls[0].strip()
        nm = spls[1].strip()
        if nm in namesd:
            ndoubles.append(gid)
    namesf.close()

    #now making sure that the taxonomy is functional before printing to the file

    skipids = []
    stack = idstoexclude


    print "checking functionality of taxonomy"
    print "count lefttocompare"

    count = 0
    while len(stack) != 0:
        curid = stack.pop()
        if curid in skipids:
            continue
        skipids.append(curid)
        if curid in cid:
            ids = cid[curid]
            for i in ids:
                stack.append(i)
        count += 1
        if count % 10000 == 0:
            print count,len(stack)

    for i in skipids:
        if i in lines:
            del lines[i]
        if i in synonyms:
            del synonyms[i]
        if i in nm_storage:
            del nm_storage[i]
    
    print "number of scientific names: ",len(lines)
    print "number of synonyms: ",len(synonyms)

    """
    in this section we change the names of the parent child identical names for
    1) if parent and child have the same name higher than genus, they are sunk
    2) if the parent and child have the same name at genus and subspecies (etc), the subname
    is called genusname rank subgenus name
    """

    final_nm_storage = {}

    for i in nm_storage:
        if nm_storage[i] != "root":
            if i in pid:
                if nm_storage[i] == nm_storage[pid[i]]:
                #do something for the genus 
                    if nrank[pid[i]] == "genus":
                        final_nm_storage[i] = nm_storage[pid[i]]+" "+nrank[i]+" "+nm_storage[i]
                    else:
                        idstoch = cid[i]
                        for j in idstoch:
                            pid[j] = pid[i]
                        if i in synonyms:
                            for j in synonyms[i]:
                                if pid[i] in synonyms:
                                    synonyms[pid[i]].append(j)
                                else:
                                    synonyms[pid[i]] = [j]
                            del synonyms[i]
                        del lines[i]
                #do something for everything else

    #checking for names that are the same in lineage but not parent child
    for i in ndoubles:
        if i not in nm_storage:
            continue
        stack = []
        if i in final_nm_storage:
            continue
        stack.append(i)
        while len(stack) > 0:
            cur = stack.pop()
            if cur in nm_storage:
                if cur in final_nm_storage:
                    continue
                if nm_storage[cur] == nm_storage[i]:
                    tname = ""
                    tcur = cur
                    if tcur == i:
                        continue
                    while tcur != i:
                        tname += nm_storage[tcur] +" "+nrank[tcur]+" "
                        if tcur in pid:
                            tcur = pid[tcur]
                        else:
                            break
                    final_nm_storage[cur] = nm_storage[i]+" "+nrank[i]+" "+tname
            if cur in cid:
                for j in cid[cur]:
                    stack.append(j)
    #need to print id, parent id, and name   
    for i in lines:
        spls = lines[i].split("\t|\t")
        id = spls[0].strip()
        prid = pid[spls[0]].strip()
        sname = spls[1].strip()

        #changed from sname to nm_storage to fix the dup name issue
        if i in final_nm_storage:
            nametowrite = final_nm_storage[i]
        else:
            nametowrite = nm_storage[i]

        # if it is the root node then we need to make its parent id blank and rename it "life"
        if nametowrite.strip() == "root":
            nametowrite = "life"
            prid = ""

        outfile.write(id+"\t|\t"+prid+"\t|\t"+nametowrite+"\t|\t\n")

    outfile.close()

    for i in synonyms:
        if i in lines:
            for j in synonyms[i]:
                spls = j.split("\t|\t")
                id = spls[0].strip()
                sname = spls[1].strip()
                nametp = spls[3].strip()
                outfilesy.write(id+"\t|\t"+sname+"\t|\t"+nametp+"\t|\t\n")
    outfilesy.close()
