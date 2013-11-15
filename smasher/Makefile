# The tests work in JAR's setup...

# You'll need to put a copy of the previous (or baseline) version of OTT in tax/prev_ott/.
# This is a manual step.
# Get it from http://files.opentreeoflife.org/ott/
# and if there's a file "taxonomy" change that to "taxonomy.tsv".

WHICH=2.3
PREV_WHICH=2.2

#  $^ = all prerequisites
#  $< = first prerequisite
#  $@ = file name of target

# Scripts and other inputs related to taxonomy
FEED=feed

# The tax/ directory is full of taxonomies; mostly (entirely?) derived objects.
TAX=tax

NCBI=$(TAX)/ncbi
GBIF=$(TAX)/gbif
SILVA=$(TAX)/silva

# Root of local copy of taxomachine git repo, for nematode examples
# (TBD: make local copies so that setup is simpler)
TAXOMACHINE_EXAMPLE=../../taxomachine/example

# Preottol - for filling in the preottol id column
#  https://bitbucket.org/mtholder/ottol/src/dc0f89986c6c2a244b366312a76bae8c7be15742/preOTToL_20121112.txt?at=master
PREOTTOL=../../preottol

all: ott

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

# Add tax/if/ when it starts to work

OTT_ARGS=Smasher tax/713/ $(NCBI)/ $(GBIF)/ \
      --edits $(FEED)/ott/edits/ \
      --ids $(TAX)/prev_ott/ \
      --out $(TAX)/ott/

ott: $(TAX)/ott/log.tsv
$(TAX)/ott/log.tsv: Smasher.class tax/713/taxonomy.tsv \
		    $(NCBI)/taxonomy.tsv $(GBIF)/taxonomy.tsv $(FEED)/ott/edits/ott_edits.tsv
	mkdir -p $(TAX)/ott
	java $(CP) -Xmx10g $(OTT_ARGS)
	echo $(WHICH) >$(TAX)/ott/version.txt

tax/if/taxonomy.tsv:
	mkdir -p `dirname $@`
	wget --output-document=$@ http://files.opentreeoflife.org/ott/IF/taxonomy.txt
	wget --output-document=tax/if/synonyms.tsv http://files.opentreeoflife.org/ott/IF/synonyms.txt

# Create the aux (preottol) mapping in a separate step.
# How does it know where to write to?

$(TAX)/ott/aux.tsv: Smasher.class $(TAX)/ott/log.tsv
	hava $(CP) -Xmx10G Smasher $(TAX)/ott/ --aux $(PREOTTOL)/preottol-20121112.processed

$(PREOTTOL)/preottol-20121112.processed: $(PREOTTOL)/preOTToL_20121112.txt
	python process-preottol.py $< $@

$(TAX)/prev_ott/taxonomy.tsv:
	mkdir -p $(FEED)/prev_ott/tmp
	wget --output-document=$(FEED)/prev_ott/tmp/ott$(PREV_WHICH).tgz \
	  http://files.opentreeoflife.org/ott/ott$PREV_WHICH
	(cd $(FEED)/prev_ott/tmp/; tar xf ott$(PREV_WHICH).tgz)
	mv $(FEED)/prev_ott/tmp/ott$(PREV_WHICH)/* $(TAX)/prev_ott/
	rmdir $(FEED)/prev_ott/tmp

# Formerly, where we now have /dev/null, we had
# ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP

ncbi: $(NCBI)/taxonomy.tsv
$(NCBI)/taxonomy.tsv: $(FEED)/ncbi/tmp/nodes.dmp $(FEED)/ncbi/process_ncbi_taxonomy_taxdump.py
	mkdir -p $(NCBI).tmp
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

gbif: $(GBIF)/taxonomy.tsv
$(GBIF)/taxonomy.tsv: $(FEED)/gbif/tmp/taxon.txt $(FEED)/gbif/process_gbif_taxonomy.py
	mkdir -p $(GBIF).tmp
	python $(FEED)/gbif/process_gbif_taxonomy.py \
	       $(FEED)/gbif/tmp/taxon.txt \
	       /dev/null $(GBIF).tmp
	rm -rf $(GBIF)
	mv -f $(GBIF).tmp $(GBIF)

$(FEED)/gbif/tmp/taxon.txt: $(FEED)/gbif/tmp/checklist1.zip
	(cd $(FEED)/gbif/tmp && unzip checklist1.zip)

$(FEED)/gbif/tmp/checklist1.zip:
	mkdir -p $(FEED)/gbif/tmp
	wget --output-document=$@ \
             http://ecat-dev.gbif.org/repository/export/checklist1.zip

silva: $(SILVA)
$(SILVA): $(FEED)/silva/silva.fasta
	python $(FEED)/silva/process_silva.py $(FEED)/silva $(TAX)/silva
# process_silva.py takes 74 minutes to run

# Silva 115: 206M uncompresses to 817M

$(FEED)/silva/silva.fasta:
	mkdir -p $(FEED)/silva
	wget --output-document=$(FEED)/silva/tax_ranks.txt \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/tax_ranks_ssu_115.txt
	wget --output-document=$(FEED)/silva/silva.fasta.tgz \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/SSURef_NR99_115_tax_silva.fasta.tgz
	(cd $(FEED)/silva && tar xzvf silva.fasta.tgz && mv *silva.fasta silva.fasta)

TARDIR=/raid/www/roots/opentree/ott

tarball: $(TAX)/ott/log.tsv
	(cd $(TAX) && \
	 tar czvf $(TARDIR)/ott$(WHICH).tgz.tmp ott && \
	 mv $(TARDIR)/ott$(WHICH).tgz.tmp $(TARDIR)/ott$(WHICH).tgz )

# This predates use of git on norbert...
#norbert:
#	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
#           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher
