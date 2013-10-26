# The tests work in JAR's setup...

WHICH=2.3

#  $^ = all prerequisites
#  $< = first prerequisite
#  $@ = file name of target

all: ott

NCBI=$(TAX)/ncbi
GBIF=$(TAX)/gbif
SILVA=$(TAX)/silva

# Root of local copy of taxomachine git repo, for nematode examples
# (TBD: make local copies so that setup is simpler)
TAXOMACHINE_EXAMPLE=../../taxomachine/example

# Preottol - for filling in the preottol id column
#  https://bitbucket.org/mtholder/ottol/src/dc0f89986c6c2a244b366312a76bae8c7be15742/preOTToL_20121112.txt?at=master
PREOTTOL=../../preottol

# Scripts and other inputs related to taxonomy
FEED=feed

# The tax/ directory is full of taxonomies; mostly (entirely?) derived objects.
TAX=tax

# Nematode test
CP=-classpath .:jscheme.jar
TEST_ARGS=Smasher $(TAX)/nem_ncbi/ $(TAX)/nem_gbif/ \
      --edits $(FEED)/nem/edits/ \
      --ids $(TAX)/prev_nem/ \
      --out $(TAX)/nem/

nem: $(TAX)/nem/log.tsv
$(TAX)/nem/log.tsv: Smasher.class $(TAX)/prev_nem/taxonomy.tsv $(TAX)/nem_ncbi/taxonomy.tsv $(TAX)/nem_gbif/taxonomy.tsv
	mkdir -p $(TAX)/nem/
	java $(CP) $(TEST_ARGS)

debug:
	jdb $(CP) $(TEST_ARGS)

compile: Smasher.class

Smasher.class: Smasher.java
	javac $(CP) -g Smasher.java

# Inputs to the nem test

$(TAX)/nem_ncbi/taxonomy.tsv:
	mkdir -p `dirname $@`
	cp -p $(TAXOMACHINE_EXAMPLE)/nematoda.ncbi $@

$(TAX)/nem_gbif/taxonomy.tsv:
	mkdir -p `dirname $@`
	cp -p $(TAXOMACHINE_EXAMPLE)/nematoda.gbif $@

# little test of --select feature
dory-test.tsv: $(TAX)/nem/log.tsv Smasher.class
	java $(CP) Smasher --start $(TAX)/nem/ --select Dorylaimida $@

# --------------------------------------------------------------------------

OTT_ARGS=Smasher $(NCBI)/taxonomy.tsv $(GBIF)/taxonomy.tsv \
      --edits edits/ \
      --ids $(TAX)/prev_ott/ \
      --out $(TAX)/ott/

ott: $(TAX)/ott/log.tsv
$(TAX)/ott/log.tsv: Smasher.class $(NCBI)/taxonomy.csv $(GBIF)/taxonomy.csv
	mkdir -p $(TAX)/ott
	java $(CP) -Xmx10g $(OTT_ARGS)
	echo $(WHICH) >$(TAX)/ott/version.txt

# Create the aux (preottol) mapping in a separate step.
# How does it know where to write to?

$(TAX)/ott.aux.tsv: Smasher.class $(TAX)/ott/log.tsv
	hava $(CP) -Xmx10G Smasher $(TAX)/ott/ --aux $(PREOTTOL)/preottol-20121112.processed

$(PREOTTOL)/preottol-20121112.processed: $(PREOTTOL)/preOTToL_20121112.txt
	python process-preottol.py $< $@

# Formerly, where we now have /dev/null, we had
# ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP

ncbi: $(NCBI)/taxonomy.tsv
$(NCBI)/taxonomy.tsv: $(FEED)/ncbi/tmp/nodes.dmp $(FEED)/ncbi/process_ncbi_taxonomy_taxdump.py
	mkdir -p $(NCBI)
	python $(FEED)/ncbi/process_ncbi_taxonomy_taxdump.py F $(FEED)/ncbi/tmp \
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

$(FEED)/silva/silva.fasta:
	mkdir -p $(FEED)/silva
	wget --output-document=$(FEED)/silva/tax_ranks.txt \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/tax_ranks_ssu_115.txt
	wget --output-document=$(FEED)/silva/silva.fasta.tgz \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/SSURef_NR99_115_tax_silva.fasta.tgz
	(cd $(FEED)/silva && tar xzvf silva.fasta.tgz && mv *silva.fasta silva.fasta)

# Silva 115: 206M uncompresses to 817M

TARDIR=/raid/www/roots/opentree/ott

tarball: $(WORK)/$(WHICH)/log
	(cd $(WORK) && \
	 tar czvf $(TARDIR)/$(WHICH).tgz.tmp $(WHICH) && \
	 mv $(TARDIR)/$(WHICH).tgz.tmp $(TARDIR)/$(WHICH).tgz)

norbert:
	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher
