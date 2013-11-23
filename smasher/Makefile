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
CP=-classpath ".:lib/*"
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

compile: Smasher.class lib/jscheme.jar lib/json-simple-1.1.1.jar

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

# internal tests
test: Smasher.class
	java $(CP) Smasher --test

# --------------------------------------------------------------------------

# Add tax/if/ when it starts to work

OTT_ARGS=Smasher $(SILVA)/ tax/713/ $(NCBI)/ $(GBIF)/ \
      --edits $(FEED)/ott/edits/ \
      --ids $(TAX)/prev_ott/ \
      --out $(TAX)/ott/

ott: $(TAX)/ott/log.tsv
$(TAX)/ott/log.tsv: Smasher.class $(SILVA)/taxonomy.tsv tax/713/taxonomy.tsv \
		    $(NCBI)/taxonomy.tsv $(GBIF)/taxonomy.tsv \
		    $(FEED)/ott/edits/ott_edits.tsv
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
	mkdir -p $(FEED)/prev_ott/in
	wget --output-document=$(FEED)/prev_ott/in/ott$(PREV_WHICH).tgz \
	  http://files.opentreeoflife.org/ott/ott$PREV_WHICH
	(cd $(FEED)/prev_ott/in/; tar xf ott$(PREV_WHICH).tgz)
	mv $(FEED)/prev_ott/in/ott$(PREV_WHICH)/* $(TAX)/prev_ott/
	if [ -e $(TAX)/prev_ott/taxonomy ]; then mv $(TAX)/prev_ott/taxonomy $(TAX)/prev_ott/taxonomy.tsv; fi
	if [ -e $(TAX)/prev_ott/synonyms ]; then mv $(TAX)/prev_ott/synonyms $(TAX)/prev_ott/synonyms.tsv; fi
	rmdir $(FEED)/prev_ott/in

# Formerly, where we now have /dev/null, we had
# ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP

ncbi: $(NCBI)/taxonomy.tsv
$(NCBI)/taxonomy.tsv: $(FEED)/ncbi/in/nodes.dmp $(FEED)/ncbi/process_ncbi_taxonomy_taxdump.py
	mkdir -p $(NCBI).tmp
	python $(FEED)/ncbi/process_ncbi_taxonomy_taxdump.py F $(FEED)/ncbi/in \
            /dev/null $(NCBI).tmp
	rm -rf $(NCBI)
	mv -f $(NCBI).tmp $(NCBI)

$(FEED)/ncbi/in/nodes.dmp: $(FEED)/ncbi/taxdump.tar.gz
	mkdir -p `dirname $@`
	tar -C $(FEED)/ncbi/in -xzvf $(FEED)/ncbi/taxdump.tar.gz
	touch $@

$(FEED)/ncbi/taxdump.tar.gz:
	mkdir -p $(FEED)/ncbi
	wget --output-document=$(FEED)/ncbi/taxdump.tar.gz \
 	     ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz

# Formerly, where it says /dev/null, we had ../data/gbif/ignore.txt

gbif: $(GBIF)/taxonomy.tsv
$(GBIF)/taxonomy.tsv: $(FEED)/gbif/in/taxon.txt $(FEED)/gbif/process_gbif_taxonomy.py
	mkdir -p $(GBIF).tmp
	python $(FEED)/gbif/process_gbif_taxonomy.py \
	       $(FEED)/gbif/in/taxon.txt \
	       /dev/null $(GBIF).tmp
	rm -rf $(GBIF)
	mv -f $(GBIF).tmp $(GBIF)

$(FEED)/gbif/in/taxon.txt: $(FEED)/gbif/in/checklist1.zip
	(cd $(FEED)/gbif/in && unzip checklist1.zip)

$(FEED)/gbif/in/checklist1.zip:
	mkdir -p $(FEED)/gbif/in
	wget --output-document=$@ \
             http://ecat-dev.gbif.org/repository/export/checklist1.zip

# Significant tabs !!!

silva: $(SILVA)/taxonomy.tsv
$(SILVA)/taxonomy.tsv: $(FEED)/silva/process_silva.py $(FEED)/silva/in/silva.fasta
	mkdir -p $(FEED)/silva/out
	python $(FEED)/silva/process_silva.py $(FEED)/silva/in $(FEED)/silva/out
	mkdir -p $(SILVA)
	cp -p $(FEED)/silva/out/taxonomy.tsv $(SILVA)/taxonomy.tsv

# Silva 115: 206M uncompresses to 817M

$(FEED)/silva/in/silva.fasta:
	mkdir -p `basename $@`
	wget --output-document=$(FEED)/silva/in/tax_ranks.txt \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/tax_ranks_ssu_115.txt
	wget --output-document=$(FEED)/silva/in/silva.fasta.tgz \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/SSURef_NR99_115_tax_silva.fasta.tgz
	(cd $(FEED)/silva/in && tar xzvf silva.fasta.tgz && mv *silva.fasta silva.fasta)

TARDIR=/raid/www/roots/opentree/ott

tarball: $(TAX)/ott/log.tsv
	(cd $(TAX) && \
	 tar czvf $(TARDIR)/ott$(WHICH).tgz.tmp ott && \
	 mv $(TARDIR)/ott$(WHICH).tgz.tmp $(TARDIR)/ott$(WHICH).tgz )

# This predates use of git on norbert...
#norbert:
#	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
#           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher

# ERROR: certificate common name `google.com' doesn't match requested host name `code.google.com'.

lib/json-simple-1.1.1.jar:
	wget --output-document=$@ --no-check-certificate \
	  "https://json-simple.googlecode.com/files/json-simple-1.1.1.jar"