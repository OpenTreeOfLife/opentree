import sys,os

#reads the homonym list from the verify_taxonomies.py

#the goal here is to output a file with the ids to exclude

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print "python check_homonyms_in_irmng.py homonym.log irmng.csv outfile"
        sys.exit(0)
    
    infile = open(sys.argv[1],"r")
    start = False
    dupnames = {}
    dupnamesid = {}
    notfound = [] # these will just be printed out
    for i in infile:
        if i.strip() == "==homonyms":
            print "start processing homonyms"
            start = True
        elif start == True:
            spls = i.strip().split("\t")
            addlist = []
            idlist = []
            if spls[0].split(")")[1] not in dupnames:
                dupnames[spls[0].split(")")[1]] = []
                dupnamesid[spls[0].split(")")[1]] = []
            for j in spls:
                tid=j.split(")")[0][1:]
                tname = j.split(")")[1]
                addlist.append(tname)
                idlist.append(tid)
            dupnames[spls[0].split(")")[1]].append(addlist)
            dupnamesid[spls[0].split(")")[1]].append(idlist)
    infile.close()
    print len(dupnames)
    
    #reading in the irmng
    irmngresults = {}
    cat = []
    infile = open(sys.argv[2],"r")
    for i in infile:
        spls = i.strip().split("\t")
        if len(spls) < 4:
            continue
        if spls[3] in dupnames and "genus" in spls[16]:
#            print spls[3],spls[10],spls[15]
            if spls[3] not in irmngresults:
                irmngresults[spls[3]] = []
            if "unallocated" in spls[10]:
                spls2 = spls[10].split(" ")
                irmngresults[spls[3]].append([spls2[0],spls2[1]])                
            else:
                irmngresults[spls[3]].append([spls[10],spls[15]])
            if spls[15] not in cat:
                cat.append(spls[15])
    infile.close()
    
    print cat

    outfile = open(sys.argv[3],"w")

    #if nuclear than it means that it will print out the ids for all the homonyms
    nuclear = True
    if nuclear:
        for i in dupnames:
            for j in dupnamesid[i]:
                outfile.write(j[0]+"\n")
    else:
        for i in dupnames:
            if i in irmngresults:
                for j in range(len(dupnames[i])):
                    for k in irmngresults[i]:
                        if k[0] in dupnames[i][j]:
                            if k[1] == "synonym" or k[1] == "(unallocated)":
                                outfile.write(dupnamesid[i][j][0]+"\n")
            else:
                for j in dupnamesid[i]:
                    outfile.write(j[0]+"\n")
    
    outfile.close()
