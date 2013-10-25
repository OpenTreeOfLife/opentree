# The tests work in JAR's setup...

#  $^ = all prerequisites
#  $< = first prerequisite
#  $@ = file name of target

all: ott22

# Root of local copy of taxomachine git repo
TAXOMACHINE_ROOT=../../taxomachine

# Root of 'ottol' directory (from
#  https://bitbucket.org/blackrim/avatol-taxonomies/downloads#download-155949 )
# for initial OTT ids and regression testing
OTTOL=../../ottol

# Preottol
#  https://bitbucket.org/mtholder/ottol/src/dc0f89986c6c2a244b366312a76bae8c7be15742/preOTToL_20121112.txt?at=master
# for filling in the preottol id column
PREOTTOL=../../preottol

# Working areas (temporary, unversioned)
WORK=tmp
FEED=feed

CP=-classpath .:jscheme.jar
TEST_ARGS=Smasher $(TAXOMACHINE_ROOT)/example/nematoda.ncbi $(TAXOMACHINE_ROOT)/example/nematoda.gbif \
      --edits nem-edits/ \
      --ids $(WORK)/nem1.ott \
      --aux $(WORK)/nem1.preottol \
      --out $(WORK)/nem2/

NCBI=$(FEED)/ncbi/tax
GBIF=$(WORK)/gbif.processed
SILVA=$(WORK)/silva.processed

compile: Smasher.class

Smasher.class: Smasher.java
	javac $(CP) -g Smasher.java

test: $(WORK)/nem2/log
$(WORK)/nem2/log: Smasher.class $(WORK)/nem1.preottol $(WORK)/nem1.ott
	mkdir -p $(WORK)/nem2/
	java $(CP) $(TEST_ARGS)

debug:
	mkdir -p $(WORK)
	jdb $(CP) $(TEST_ARGS)

WHICH=ott2.2

OTT22_ARGS=Smasher $(NCBI) $(GBIF) \
      --edits edits/ \
      --ids $(WORK)/ott2.1/taxonomy \
      --aux $(PREOTTOL)/preottol-20121112.processed \
      --out $(WORK)/ott2.2/

ott: $(WORK)/$(WHICH)/log
$(WORK)/ott2.2/log: Smasher.class $(NCBI)/taxonomy.csv $(GBIF)/taxonomy.csv $(PREOTTOL)/preottol-20121112.processed 
	mkdir -p $(WORK)/ott2.2
	java $(CP) -Xmx10g $(OTT22_ARGS)

# little test of --select feature
$(WORK)/dory.foo: $(WORK)/nem2/taxonomy Smasher.class
	java $(CP) Smasher --start $< --select Dorylaimida $@

# Inputs to the nem2 test
$(WORK)/nem1.preottol: $(PREOTTOL)/preottol-20121112.processed
	mkdir -p $(WORK)
	java $(CP) -Xmx3g Smasher --start $< --select Nematoda $@

$(WORK)/nem1.ott: $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids
	java $(CP) -Xmx3g Smasher --start $< --select Nematoda $@

$(FEED)/nem-ncbi/tax/taxonomy.tsv:
	mkdir -p $(FEED)/nem-ncbi/tax
	cp -p $(TAXOMACHINE_ROOT)/example/nematoda.ncbi $(FEED)/nem-ncbi/tax/taxonomy.tsv
	touch $(FEED)/nem-ncbi/tax/synonyms.tsv

$(FEED)/nem-gbif/tax/taxonomy.tsv:
	mkdir -p $(FEED)/nem-gbif/tax
	cp -p $(TAXOMACHINE_ROOT)/example/nematoda.gbif $(FEED)/nem-gbif/tax/taxonomy.tsv
	touch $(FEED)/nem-gbif/tax/synonyms.tsv

$(PREOTTOL)/preottol-20121112.processed: $(PREOTTOL)/preOTToL_20121112.txt
	python process-preottol.py $< $@

# Formerly, where we now have /dev/null, we had
# ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP

ncbi: $(NCBI)/taxonomy.tsv
$(NCBI)/taxonomy.tsv: $(FEED)/ncbi/nodes.dmp process_ncbi_taxonomy_taxdump.py
	python process_ncbi_taxonomy_taxdump.py F $(FEED)/ncbi \
            /dev/null $(NCBI).tmp
	rm -rf $(NCBI)
	mv -f $(NCBI).tmp $(NCBI)

$(FEED)/ncbi/nodes.dmp: $(FEED)/ncbi/taxdump.tar.gz
	tar -C $(FEED)/ncbi -xzvf $(FEED)/ncbi/taxdump.tar.gz
	touch $(FEED)/ncbi/*.dmp

$(FEED)/ncbi/taxdump.tar.gz:
	mkdir -p $(FEED)/ncbi
	wget --output-document=$(FEED)/ncbi/taxdump.tar.gz \
 	     ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz

# Formerly, where it says /dev/null, we had ../data/gbif/ignore.txt

gbif: $(GBIF)
$(GBIF): $(WORK)/gbif/taxon.txt process_gbif_taxonomy.py
	python process_gbif_taxonomy.py \
	       $(WORK)/gbif/taxon.txt \
	       /dev/null $@.tmp
	mv -f $@.tmp $@
	mv -f $@.tmp.synonyms $@.synonyms

$(WORK)/gbif/taxon.txt:
	mkdir -p $(WORK)/gbif
	wget --output-document=$(WORK)/gbif/checklist1.zip \
             http://ecat-dev.gbif.org/repository/export/checklist1.zip
	(cd $(WORK)/gbif && unzip checklist1.zip)

silva: $(SILVA)
$(SILVA): $(WORK)/silva/silva.fasta
	(D=$(PWD); cd $(WORK)/silva; python $$D/process_silva.py)
# process_silva.py takes 74 minutes to run

$(WORK)/silva/silva.fasta:
	mkdir -p $(WORK)/silva
	wget --output-document=$(WORK)/silva/tax_ranks.txt \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/tax_ranks_ssu_115.txt
	wget --output-document=$(WORK)/silva/silva.fasta.tgz \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/SSURef_NR99_115_tax_silva.fasta.tgz
	(cd $(WORK)/silva && tar xzvf silva.fasta.tgz && mv *silva.fasta silva.fasta)

# Silva 115: 206M uncompresses to 817M

TARDIR=/raid/www/roots/opentree/ott

tarball: $(WORK)/$(WHICH)/log
	(cd $(WORK) && \
	 tar czvf $(TARDIR)/$(WHICH).tgz.tmp $(WHICH) && \
	 mv $(TARDIR)/$(WHICH).tgz.tmp $(TARDIR)/$(WHICH).tgz)

norbert:
	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher
