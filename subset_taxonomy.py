import sys,os,sqlite3
import os.path

"""
this will take a processed taxonomy ready for input into the database and subset it
for a particular taxon and its descendents
"""

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print "python subset_taxonomy.py target infile outfile"
        sys.exit(0)
    
    target = (sys.argv[1]).strip()
    print "target taxa: ",target
    infile = open(sys.argv[2],"r")
    outfile = open(sys.argv[3],"w")

    count = 0
    pid = {} #key is the child id and the value is the parent
    cid = {} #key is the parent and value is the list of children
    nid = {}
    targetid = ""
    for i in infile:
        spls = i.strip().split("\t|")
        tid = spls[0].strip()
        parentid = spls[1].strip()
        name = spls[2].strip()
        nid[tid] = name
        if name == target:
            print "name set ",tid
            targetid = tid
        pid[tid] = parentid
        if parentid not in cid: 
            cid[parentid] = []
        cid[parentid].append(tid)
        count += 1
        if count % 100000 == 0:
            print count
    infile.close()
    
    stack = [targetid]
    while len(stack) > 0:
        tempid = stack.pop()
        outfile.write(tempid+"\t|\t"+pid[tempid]+"\t|\t"+nid[tempid]+"\t|\t\n")
        if tempid in cid:
            for i in cid[tempid]:
                stack.append(i)
    outfile.close()

