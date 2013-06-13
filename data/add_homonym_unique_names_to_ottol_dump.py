import os,sys
from collections import Counter

"""
this will create a uniqname in the last column given an ottol dump
that will look like name (). 
"""

if __name__ == "__main__":
	if len(sys.argv) != 3:
		print "python "+sys.argv[0]+" ottol_dump outfile"
		sys.exit(0)
	
	infile = open(sys.argv[1],"r")
	names = []
	namesd = {} 
	ranks = {} #id, rank
	ids = {} #id, name
	pids = {} #id, pid
	sids = {} #id, source id
	snms = {} #id, sourcename
	count = 0
	for i in infile:
		spls = i.split("\t|\t")
		spls = spls[:-1]
		names.append(spls[2])
		if spls[2] not in namesd:
			namesd[spls[2]] = []
		namesd[spls[2]].append(spls[0])
		ids[spls[0]] = spls[2]
		pids[spls[0]] = spls[1]
		ranks[spls[0]] = spls[3]
		sids[spls[0]] = spls[5]
		snms[spls[0]] = spls[4]
		count += 1
		if count % 100000 == 0:
			print "1 ",count
	infile.close()
	print "counting"
	b  = Counter(names)
	count = 0
	homonyms = []
	uniqnames = {} #id name
	for i in b:
		if b[i] > 1:
			homonyms.append(i)
			#go through each homonymn
			for j in range(len(namesd[i])):
				uniqname = ""
				nr = ""
				if ranks[namesd[i][j]] != "no rank" and len(ranks[namesd[i][j]]) > 1:
					nr = ranks[namesd[i][j]]
				mnp = ""
				mrk = ""
				deepest = 0
				atroot = False
				for k in range(len(namesd[i])):
					if j == k:
						continue
					curcount = 1
					pid = pids[namesd[i][j]]
					pn = ids[pid]
					pr = ""
					if ranks[pid] != "no rank" and len(ranks[pid]) > 1:
						pr = ranks[pid]
					cpid = pids[namesd[i][k]]
					cpn = ids[cpid]
					while pn == cpn:
						pid = pids[pid]
						try:
							pn = ids[pid]
							pr = ranks[pid]
						except:
							print pid,pn,k,j,i
							atroot = True
							break
						cpid = pids[cpid]
						cpn = ids[cpid]
						curcount += 1
					if curcount > deepest:
						deepest = curcount
						mnp = pn
						mrk = pr
				if atroot == True:
					uniqname = i+" ("+snms[namesd[i][j]]+":"+sids[namesd[i][j]]+")"
				else:
					uniqname =  i+" ("+nr+" in "+mnp+" "+mrk+")"
				uniqnames[namesd[i][j]] = uniqname
		count += 1
		if count % 100000 == 0:
			print "2 ",count
	

	infile = open(sys.argv[1],"r")
	outfile = open(sys.argv[2],"w")
	first = True
	count = 0
	for i in infile:
		if first == True:
			first = False
			outfile.write(i.strip()+"\tuniqname\t|\t\n")
			continue
		uniqname = ""
		spls = i.split("\t|\t")
		spls = spls[:-1]
		if spls[0] in uniqnames:
			uniqname = uniqnames[spls[0]]
		t = "\t|\t".join(spls)
		t += "\t|\t"+uniqname+"\t|\t\n"
		outfile.write(t)
		count += 1
		if count % 100000 == 0:
			print "3 ",count

	outfile.close()
	infile.close()
	
