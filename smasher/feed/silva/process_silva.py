''''
Script received from Jessica Grant, 8 October 2013

This script takes as input the ssu fasta from Silva (in this case SSURef_NR99_115_tax_silva.fasta
but change as necessary.)  Also 'tax_rank.txt' for the rank file from Silva ftp.

It outputs 
	the taxonomy in this format:
	<taxonid>\t|\t<parentid>\t|\t<taxon>\t|\t<rank>\t|\t<seqid>
	also two additional files that might not be necessary:
	homonym_paths.txt for checking taxa called as homonyms
	silva_taxonly.txt a list of the taxa that are included in the taxonomy.

seqid is the unique identifier from Silva of the SSU sequence, and is there for the species only.  Other 
ranks have 'no seq'

Be aware of a few things - 
	I have ignored plants, animals and fungi because they have reasonable taxonomies elsewhere.

	Silva has 'uncultured' as a taxon, between the species and its genus. e.g.:
	
>U81762.1.1448 Bacteria;Firmicutes;Clostridia;Clostridiales;Ruminococcaceae;uncultured;uncultured bacterium
	
	I have ignored this so this uncultured bacterium would get mapped to Ruminococcaceae

	All duplicate species names get their own unique number, but duplicate names of genera or above
	are checked for homonyms. - Homonyms are determined by having different parents - in some cases this
	can add taxa that really are the same.  e.g. Dinobryon here:
	
['Eukaryota', 'SAR', 'Stramenopiles', 'Chrysophyceae', 'Ochromonadales', 'Dinobryon', 'Dinobryon divergens']
['Eukaryota', 'SAR', 'Stramenopiles', 'Chrysophyceae', 'Ochromonadales', 'Ochromonas', 'Dinobryon', 'Dinobryon cf. sociale']	

	
	Other problems exist in Silva - for example in these two paths, 'marine group' is treated as a taxon (and is 
	picked up as homonymic) when it really isn't.
	
['Bacteria', 'Acidobacteria', 'Holophagae', 'Holophagales', 'Holophagaceae', 'marine group', 'uncultured bacterium']
['Bacteria', 'Cyanobacteria', 'SubsectionI', 'FamilyI', 'marine group', 'cyanobacterium UCYN-A']

	Or  here, where '43F-1404R' seems to be treated as a taxon when it is probably a primer set: 
	
['Bacteria', 'Acidobacteria', 'Holophagae', 'Subgroup 10', '43F-1404R', 'uncultured Acidobacteria bacterium']
['Bacteria', 'Proteobacteria', 'Deltaproteobacteria', '43F-1404R', 'uncultured bacterium']

	
	I left in things like 'Bacteria', 'Cyanobacteria', 'Chloroplast', 'Oryza sativa Japonica Group'
	even though the it could be confusing.  Chloroplast (and other symbiont) data may need special treatment

'''
import sys
import re
import string


pathdict = {} #given the sequence identifier, return the taxonomy path
seqdict = {} #given the taxon name, return (<species id assigned here>,<unique sequence id from SSU ref file>) 
Seen = {} # to tell whether the taxon name has been seen before - to know if homonym check needs to be done
taxondict = {}  # maps (parentid, name) to taxonid


def makePathDict(infilename, outfilename):
	infile = open(infilename,'rU')
	outfile = open(outfilename,'w') # I'm writing this out to have the taxonomy separate from the sequences - not necessary
	for line in infile:  #removing plants, animals, fungi, chloroplast and mitochondrial sequences - also specifying Oryza because it is problematic in this version the database (SSURef_NR99_115_tax_silva.fasta).
		if line[0] == '>' and not re.search('Metazoa',line) and not re.search('Fungi',line) and not re.search('Archaeplastida',line) and not re.search('Chloroplast',line) and not re.search('mitochondria',line)  and not re.search('Oryza',line):	
			taxlist = []		
			uid = line.split()[0].strip() # was going to use the species but there are multiple 'unidentified', for example
			taxlist_1  = line.strip(uid).strip().split(';')
			for tax in taxlist_1:
				# JAR commented out the following... smasher takes care of these
			    # if not re.search('Incertae Sedis',tax) and tax not in taxlist:			
					taxlist.append(tax)			
			#if 'uncultured' in taxlist:
			#	taxlist.remove('uncultured') #not sure...
			pathdict[uid] = taxlist
			outfile.write(uid + ',' + str(pathdict[uid]) + '\n')
	outfile.close()		
	return pathdict	

def checkHomonym(uid,taxon,pathdict,olduid,homfilename):
	newpath = pathdict[uid]
	oldpath = pathdict[olduid]
	newparindex = pathdict[uid].index(taxon) - 1
	oldparindex = pathdict[olduid].index(taxon) - 1
	if oldpath[oldparindex] in newpath[newparindex] and oldpath[oldparindex]: #parent of original in new path
		return True #link new to old
	else:
		hom_outfile = open(homfilename,'a')
		hom_outfile.write(taxon + ',' + str(newpath)+ ',' +str(oldpath) + '\n')
		hom_outfile.close()
		return newpath[newparindex]

ranks = {}

def readRanks(indir):
	rankfilename = indir + '/tax_ranks.txt'
	rankfile = open(rankfilename,'r')
	for line in rankfile:
		path,node,rank,remark = line.split('\t')
		components = path.split(';')
		if len(components) >= 2:
			rank_key = (node,components[-2])
			if rank_key in ranks and ranks[rank_key] != rank:
				print "Homonym with parent homonym", rank_key
				ranks[rank_key] = 'no rank'
			else:
				ranks[rank_key] = rank
	rankfile.close()

def parseSilva(pathdict, indir, outdir):
	readRanks(indir)
	rank = 'no rank' #for now
	outfile = open(outdir + '/taxonomy.tsv','w')
	outfile.write('0\t|\t\t|\tlife\t|\tno rank\t|\t\n')
	count = 1
	homfilename = outdir + '/homonym_paths.txt'
    # uid is a unique sequence id e.g. A58083.1.1474
	for uid in pathdict.keys():
		which = 0
		parentid = 0
		par = ''      #for rank lookup
		accession = string.split(uid.lstrip('>'),".",1)[0]
		for taxname in pathdict[uid]:
			taxon_key = (parentid, taxname)
			if taxon_key in taxondict:
				taxonid = taxondict[taxon_key]
			else:
				# No taxon with this name and parent.  Grow the tree.
				taxonid = count
				taxondict[taxon_key] = count
				count = count + 1

				seqid = '' # was 'no seq id'

				if which == len(pathdict[uid])-1:
					seqdict[taxname] = (taxonid,uid)  #for homonym checking ??
					seqid = 'seq:' + accession
					# Consider rank = 'sequence' or 'sample'
					rank = 'species'
				else:
					# silva: = http://www.arb-silva.de/browser/ssu/silva/
					# This link doesn't really work... one click short of destination
					seqid = "silva:%s/#%d"%(accession, which+1)
					if which == 0:  #taxname in ['Bacteria','Eukaryota','Archaea']: 
						rank = 'domain'
					else:									
						#returns true if this taxon and the one in the db have the same parent
						if taxname in seqdict:
							checkHomonym(uid,taxname,pathdict,seqdict[taxname][1],homfilename)
						seqdict[taxname] = (taxonid,uid)

						rank_key = (taxname,par)
						if rank_key in ranks:
							rank = ranks[rank_key].lower()
						else:
							rank = 'no rank'

				taxname = taxname.replace('Incertae Sedis', 'incertae sedis')
				if rank == 'major_clade':
					rank = 'no rank'
				# Some of the 'uncultured' taxa are incorrectly assigned rank 'class' or 'order'
				if taxname == 'uncultured':
					rank = 'no rank'
				outfile.write(str(taxonid) + '\t|\t' + str(parentid)  + '\t|\t' + taxname  + '\t|\t' + rank + '\t|\t' + seqid + '\n')
			which = which + 1
			parentid = taxonid
			par = taxname
	outfile.close()
	
def main():
	indir = sys.argv[1]
	outdir = sys.argv[2]
	# was: infile = open('SSURef_NR99_115_tax_silva.fasta','rU')
	pathdict = makePathDict(indir + '/silva.fasta', outdir + '/silva_taxonly.txt')
	parseSilva(pathdict, indir, outdir)
	
main()
