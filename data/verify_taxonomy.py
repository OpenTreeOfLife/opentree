import sys,os

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print "python verify_taxonomy.py intax.table outfile.log"
        sys.exit(0)
    parents = {} #key is id, value is parent
    childs = {} #key is id, value is list of child ids
    names = {}#key is id, value is name
    namesl = []
    namesall = {}
    namesdup = []
    infile = open(sys.argv[1])
    count = 0
    for i in infile:
        spls = i.split("\t|\t") #the last one is a new line
        if len(spls[1]) > 0:    
            parents[spls[0]] = spls[1]
        names[spls[0]] = spls[2]
        if spls[2] not in namesall:
            namesall[spls[2]] = []
            namesl.append(spls[2])
        else:
            if spls[2] not in namesdup:
                namesdup.append(spls[2])
        namesall[spls[2]].append(spls[0])
        count += 1
        if count % 10000 == 0:
            print count
    infile.close()

    #check for parent same as child
    outfile = open(sys.argv[2],"w")
    outfile.write("==parent same as child\n")
    parentchild = []
    for i in parents:
        name1 = names[parents[i]]
        name2 = names[i]
        if name1 == name2:
            parentchild.append(name1)
            outfile.write(name1)
            outfile.write("\n")
    
    #check for homonyms
    #only print out those that are in the same higher taxonomy
    onlyinvalid = True
    lastcuridlistnum = -3 #for ncbi this needs to be -3, for others it is -1
    outfile.write("==homonyms\n")
    if onlyinvalid == False:
        for i in namesdup:
            for j in namesall[i]:
                curid = j
                while curid in parents:
                    outfile.write("("+curid+")"+names[curid]+" ")
                    curid = parents[curid]
                outfile.write("\n")
        outfile.close()
    else:
        for i in namesdup:
            higher = None
            printout = False
            stri = ""
            for j in namesall[i]:
                curid = j
                lastcurid = j
                lastcuridlist = []
                while curid in parents:
                    stri += "("+curid+")"+names[curid]+"\t"
                    lastcurid = curid
                    lastcuridlist.append(curid)
                    curid = parents[curid]
                stri += "\n"
                if higher == None:
                    higher = lastcuridlist[lastcuridlistnum]
                else:
                    if higher == lastcuridlist[lastcuridlistnum]:
                        printout = True
            if printout:
                outfile.write(stri)
        outfile.close()
