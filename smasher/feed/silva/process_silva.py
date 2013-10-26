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
import re

#infile = open('SSURef_NR99_115_tax_silva.fasta','rU')
infile = open('silva.fasta','rU')


taxdict = {} #given the sequence identifier, return the taxonomy list
iddict = {} #given the sequence name, return (<species id assigned here>,<unique sequence id from SSU ref file>) 
Seen = {} # to tell whether the taxon name has been seen before - to know if homonym check needs to be done

iddict['Bacteria'] = (1,0)
iddict['Eukaryota'] = (2,0)
iddict['Archaea'] = (3,0)




def makedict():
	
	outfile = open('silva_taxonly.txt','w') # I'm writing this out to have the taxonomy separate from the sequences - not necessary
	for line in infile:
		if line[0] == '>' and not re.search('Metazoa',line) and not re.search('Fungi',line) and not re.search('Archaeplastida',line):	
			taxlist = []		
			uid = line.split()[0].strip() # was going to use the species but there are multiple 'unidentified', for example
			taxlist_1  = line.strip(uid).strip().split(';')
			for tax in taxlist_1:				
				if not re.search('Incertae Sedis',tax) and tax not in taxlist:			
					taxlist.append(tax)			
			if 'uncultured' in taxlist:
				taxlist.remove('uncultured') #not sure...
				
			taxdict[uid] = taxlist
			outfile.write(uid + ',' + str(taxdict[uid]) + '\n')
	outfile.close()		
	return taxdict	


def checkHomonym(uid,taxon,taxdict,olduid):		
	newtaxonomy = taxdict[uid]
	oldtaxonomy = taxdict[olduid]
	newparindex = taxdict[uid].index(taxon) - 1
	oldparindex = taxdict[olduid].index(taxon) - 1
	if oldtaxonomy[oldparindex] in newtaxonomy[newparindex] and oldtaxonomy[oldparindex]: #parent of original in new taxonomy
		return True #link new to old
	else:
		hom_outfile = open('homonym_paths.txt','a')
		hom_outfile.write(taxon + ',' + str(newtaxonomy)+ ',' +str(oldtaxonomy) + '\n')
		hom_outfile.close()
		return newtaxonomy[newparindex]
def getRank(taxon,par):
	infile = open('tax_ranks.txt','r')
	for line in infile:
		path,node,rank,remark = line.split('\t')
		if node == taxon and par == path.split(';')[-2]:
			return rank
	return 'no rank'
def parseSilva(taxdict):
	rank = 'no rank' #for now
	outfile = open('formatted_Silva.txt','w')
	outfile.write('0\t|\t \t|\tLife\t|\tno rank\t|\tno seq\n')
	count = 4
	for uid in taxdict.keys():
		for taxon in taxdict[uid]:
			if taxon in ['Bacteria','Eukaryota','Archaea']: 
				parentid = 0
				speciesid = iddict[taxon][0]
				par = taxon #for next in line
				seqid = 'no seq id'
				rank = 'domain'
			elif taxon == taxdict[uid][-1]: #species always gets new id, even if it has the same name as another (e.g. lots of 'unidentified bacteria') 
				parentid = iddict[par][0]
				iddict[taxon] = (count,uid) 
				speciesid = count
				count = count + 1
				par = taxon
				seqid = uid
				rank = 'species'
			else:									
				parentid = iddict[par][0]

				try:
					speciesid = iddict[taxon][0] #does it already have an id?
					if checkHomonym(uid,taxon,taxdict,iddict[taxon][1]) == True: #returns true if this taxon and the one in the db have the same parent
						speciesid = iddict[taxon][0]
					else: #add as a new taxon with parent from homonym check (not sure if this will work)

						speciesid = count
						iddict[taxon] = (count,uid)
						count = count + 1
									
				except:
					speciesid = count
					iddict[taxon] = (count,uid)
					count = count + 1
				rank = getRank(taxon,par)
				par = taxon
				seqid = 'no seq id'	
				
			try:
				check = Seen[(speciesid,taxon)]
			except:
				Seen[(speciesid,taxon)] = 'yes'		
				outfile.write(str(speciesid) + '\t|\t' + str(parentid)  + '\t|\t' + taxon  + '\t|\t' + rank + '\t|\t' + seqid + '\n')
	outfile.close()
	
def main():
	
	taxdict = makedict()
	parseSilva(taxdict)

	
main()
