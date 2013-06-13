import os,sys

if len(sys.argv) != 4:
    print "python copy_preottol_ids_over.py preottol ottol outfile"
    sys.exit(0)

po = open(sys.argv[1],"r")
ot = open(sys.argv[2],"r")
ou = open(sys.argv[3],"w")
oids_map = {}
first = True
for i in po:
    if first == True:
        first = False
        continue
    spls = [i.strip() for i in i.strip().split("|")]
    if spls[1] not in oids_map:
        oids_map[spls[1]] = []
    oids_map[spls[1]].append(spls[0])
po.close()

first = True
for i in ot:
    if first == True:
        first = False
        ou.write(i.rstrip()+"\tpreottol_id\t|\t\n")
        continue
    b = i.rstrip()+"\t"
    spls = [i.strip() for i in i.strip().split("|")]
    if spls[0] in oids_map:
        if len(oids_map[spls[0]]) > 1:
            b += ",".join(oids_map[spls[0]])
        else:
            b += oids_map[spls[0]][0]
    b += "\t|\t"
    ou.write(b+"\n")
ot.close()
ou.close()
