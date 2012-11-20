import sys,os

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print "python id_preottol_homonyms.py intax.verified IRMNG_DWC_20120809.csv outfile.log"
        sys.exit(0)
    names = {} #key is name, value is where they split
    nameslong = {}
    ids = {} # key is name, value is list of ids with that name that are the problem
    infile = open(sys.argv[1])
    count = 0
    for i in infile:
        if i[0:2] == "==":
            continue
        spls = i[1:].strip().split(" (") #the last one is a new line
#        print spls
        name =  spls[0].split(")")[1]
        if name not in names:
            names[name] = []
            nameslong[name] = []
            ids[name] = []
        ids[name].append(spls[0].split(")")[0])
        tlist = []
        for j in spls:
            tlist.append(j.split(")")[1])
        nameslong[name].append(tlist)
#        break
    #process irmng for bad names
    infile2 = open(sys.argv[2])
    irmng = {}
    for i in infile2: 
        i = i.replace(',,',',"",').replace(',,',',"",')
        spls = i.strip().split('","')
        if len(spls) < 7:
            print spls
            print len(spls)
            print i
            break
        if spls[6] == "genus":
            if spls[3] in names:
                if spls[3] not in irmng:
                    irmng[spls[3]] = []
                irmng[spls[3]].append(i)
                #if "invalid" in i or "awaiting" in i:
                    #print spls[3],i.strip()
                    #break
    print len(irmng)
    infile2.close()
    verbose = False
    outfile = open(sys.argv[3],"w")
    for i in names:
        if len(nameslong[i]) < 2:
            continue
        if i == "Lemur":
            verbose = False
        lists = nameslong[i]
        if verbose:
            print lists
        indices = [1]*(len(lists))
        indindices = [1]*(len(lists))
        for j in range(len(lists)):
            if j != 0:
                index = -1
                nomatch = False
                k = 0
                for k in range(len(lists[j])):
                    try:
                        if lists[j][-(k+1)] != lists[0][index]:
                            nomatch = True
                            break
                        else:
                            index -= 1
                    except:
                        break
                indices[j] = index
                indindices[j] = -(k+1)
        verbose = False
        #print min(indices)
        if lists[0][min(indices)+1] == "Eukaryota":
            continue
        if lists[0][min(indices)+1] == "Opisthokonta":
            if len(lists) == 2:
                continue
        outfile.write(i+"\t"+lists[0][min(indices)+1]+"\t(")
        for j in range(len(lists)):
            if j != 0:
                outfile.write(lists[j][indindices[j]])
                if len(lists)-1 == (j):
                    outfile.write(")")
                else:
                    outfile.write("\t")
            else:
                try:
                    outfile.write(lists[0][min(indices)])
                    outfile.write("\t")
                except:
                    outfile.write("NESTED")
                    outfile.write("\t")
        outfile.write("\n")
        for j in range(len(lists)):
            outfile.write( "\t"+ids[i][j]+" "+(", ".join(lists[j]))+"\n")
            
    outfile.close()
