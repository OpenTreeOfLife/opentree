# This script maps sequence accession numbers (e.g. 'AM947437') from
# Silva to NCBI taxon ids (e.g. '329270') by calling out to the NCBI
# eutils service.

import sys,os
import re
import time

infilename = sys.argv[1]
silvafilename = sys.argv[2]
outfilename = sys.argv[3]
batchsize = int(sys.argv[4])
maxbatches = int(sys.argv[5])

# for the whole deal, need batchsize*maxbatches >= 

# Get the ones that have been mapped so far from previous version of
# mapping file, and put into map.

infile = open(infilename,"r")
map = {}
for line in infile:
	fields = line.split("\t")
	map[fields[0]] = fields[1].strip()
infile.close()

print "Start with", len(map)

# Get a list of accession ids from silva that haven't been yet mapped yet.

unmapped = []
silvafile = open(silvafilename,"r")
silvapattern = re.compile(".*seq:(\S*).*")
for line in silvafile:
	probe = re.match(silvapattern,line)
	if probe != None:
		accid = probe.group(1)
		if not (accid in map):
			unmapped.append(accid)
silvafile.close()
print len(unmapped)

accpattern = re.compile(".*<TSeq_accver>(.*)\\..*</TSeq_accver>.*")
taxpattern = re.compile(".*<TSeq_taxid>(.*)</TSeq_taxid>.*")

# Look up the unmapped accession ids, in batches.

def do_one_batch(batch):
	#print batch
	tempfilename = "efetch.out"
	command = ("wget -q -O " + tempfilename +
			  " \"http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=" +
			  ",".join(batch) +
			  "&rettype=fasta&retmode=xml\"")
	print command

	os.system(command)
	tempfile = open(tempfilename,"r")
	taxids = []
	acc = None
	count = 0
	for line in tempfile:
		if acc is None:
			probe = re.match(accpattern,line)
			if probe != None:
				acc = probe.group(1)
		else:
			# Pull the taxid out of <TSeq_taxid>1056490</TSeq_taxid>
			probe = re.match(taxpattern,line)
			if probe != None:
				map[acc] = probe.group(1)
				count = count + 1
			acc = None
	tempfile.close()
	for acc in batch:
		if not (acc in map):
			print "Accession number didn't map to taxon id", acc;

nbatches = len(unmapped)/batchsize
# for i in range(nbatches):
for i in range(maxbatches):
	start = i*batchsize
	end = min(start+batchsize,len(unmapped))
	if end > start:
		do_one_batch(unmapped[start:end])
		time.sleep(1)

# Write out all of the mappings, both old and new.

outfile = open(outfilename,"w")
for accid in map.iterkeys():
	outfile.write("%s\t%s\n"%(accid, map[accid]))
outfile.close()
