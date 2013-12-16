# The tests work in JAR's setup...

# You'll need to put a copy of the previous (or baseline) version of OTT in tax/prev_ott/.
# This is a manual step.
# Get it from http://files.opentreeoflife.org/ott/
# and if there's a file "taxonomy" change that to "taxonomy.tsv".

WHICH=2.4
PREV_WHICH=2.3

#  $^ = all prerequisites
#  $< = first prerequisite
#  $@ = file name of target

# Scripts and other inputs related to taxonomy

# The tax/ directory is full of taxonomies; mostly (entirely?) derived objects.
TAX=tax

NCBI=tax/ncbi
GBIF=tax/gbif
SILVA=tax/silva
IF=tax/if

# Root of local copy of taxomachine git repo, for nematode examples
# (TBD: make local copies so that setup is simpler)
TAXOMACHINE_EXAMPLE=../../taxomachine/example

# Preottol - for filling in the preottol id column
#  https://bitbucket.org/mtholder/ottol/src/dc0f89986c6c2a244b366312a76bae8c7be15742/preOTToL_20121112.txt?at=master
PREOTTOL=../../preottol

all: ott

debug:
	jdb $(JAVA_ARGS) $(TEST_ARGS)

compile: Smasher.class lib/jscheme.jar lib/json-simple-1.1.1.jar

Smasher.class: Smasher.java
	javac -g $(CP) Smasher.java

# internal tests
test: Smasher.class
	java $(JAVA_ARGS) Smasher --test

# --------------------------------------------------------------------------

# Add tax/if/ when it starts to work

OTT_ARGS=Smasher $(SILVA)/ tax/713/ tax/if/ $(NCBI)/ $(GBIF)/ \
      --edits feed/ott/edits/ \
      --ids tax/prev_ott/ \
      --out tax/ott/

ott: tax/ott/log.tsv
tax/ott/log.tsv: Smasher.class $(SILVA)/taxonomy.tsv \
		    tax/if/taxonomy.tsv tax/713/taxonomy.tsv \
		    $(NCBI)/taxonomy.tsv $(GBIF)/taxonomy.tsv \
		    feed/ott/edits/ott_edits.tsv \
		    tax/prev_ott/taxonomy.tsv
	mkdir -p tax/ott
	java $(JAVA_ARGS) $(OTT_ARGS)
	echo $(WHICH) >tax/ott/version.txt

tax/if/taxonomy.tsv:
	mkdir -p `dirname $@`
	wget --output-document=$@ http://files.opentreeoflife.org/ott/IF/taxonomy.txt
	wget --output-document=tax/if/synonyms.tsv http://files.opentreeoflife.org/ott/IF/synonyms.txt

# Create the aux (preottol) mapping in a separate step.
# How does it know where to write to?

tax/ott/aux.tsv: Smasher.class tax/ott/log.tsv
	hava $(JAVA_ARGS) Smasher tax/ott/ --aux $(PREOTTOL)/preottol-20121112.processed

$(PREOTTOL)/preottol-20121112.processed: $(PREOTTOL)/preOTToL_20121112.txt
	python process-preottol.py $< $@

tax/prev_ott/taxonomy.tsv:
	mkdir -p feed/prev_ott/in 
	wget --output-document=feed/prev_ott/in/ott$(PREV_WHICH).tgz \
	  http://files.opentreeoflife.org/ott/ott$(PREV_WHICH).tgz
	(cd feed/prev_ott/in/ && tar xvf ott$(PREV_WHICH).tgz)
	rm -rf tax/prev_ott
	mkdir -p tax/prev_ott
	mv feed/prev_ott/in/ott*/* tax/prev_ott/
	if [ -e tax/prev_ott/taxonomy ]; then mv tax/prev_ott/taxonomy tax/prev_ott/taxonomy.tsv; fi
	if [ -e tax/prev_ott/synonyms ]; then mv tax/prev_ott/synonyms tax/prev_ott/synonyms.tsv; fi
	rm -rf feed/prev_ott/in

# Formerly, where we now have /dev/null, we had
# ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP

NCBI_URL="ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz"

ncbi: $(NCBI)/taxonomy.tsv
$(NCBI)/taxonomy.tsv: feed/ncbi/in/nodes.dmp feed/ncbi/process_ncbi_taxonomy_taxdump.py 
	mkdir -p $(NCBI).tmp
	python feed/ncbi/process_ncbi_taxonomy_taxdump.py F feed/ncbi/in \
            /dev/null $(NCBI).tmp $(NCBI_URL)
	rm -rf $(NCBI)
	mv -f $(NCBI).tmp $(NCBI)

feed/ncbi/in/nodes.dmp: feed/ncbi/taxdump.tar.gz
	mkdir -p `dirname $@`
	tar -C feed/ncbi/in -xzvf feed/ncbi/taxdump.tar.gz
	touch $@

feed/ncbi/taxdump.tar.gz:
	mkdir -p feed/ncbi
	wget --output-document=feed/ncbi/taxdump.tar.gz $(NCBI_URL)

# Formerly, where it says /dev/null, we had ../data/gbif/ignore.txt

gbif: $(GBIF)/taxonomy.tsv
$(GBIF)/taxonomy.tsv: feed/gbif/in/taxon.txt feed/gbif/process_gbif_taxonomy.py
	mkdir -p $(GBIF).tmp
	python feed/gbif/process_gbif_taxonomy.py \
	       feed/gbif/in/taxon.txt \
	       /dev/null $(GBIF).tmp
	cp -p feed/gbif/about.json $(GBIF).tmp/
	rm -rf $(GBIF)
	mv -f $(GBIF).tmp $(GBIF)

feed/gbif/in/taxon.txt: feed/gbif/in/checklist1.zip
	(cd feed/gbif/in && unzip checklist1.zip)

feed/gbif/in/checklist1.zip:
	mkdir -p feed/gbif/in
	wget --output-document=$@ \
             http://ecat-dev.gbif.org/repository/export/checklist1.zip

# Significant tabs !!!

silva: $(SILVA)/taxonomy.tsv
$(SILVA)/taxonomy.tsv: feed/silva/process_silva.py feed/silva/in/silva.fasta feed/silva/in/accessionid_to_taxonid.tsv 
	mkdir -p feed/silva/out
	python feed/silva/process_silva.py feed/silva/in feed/silva/out
	mkdir -p $(SILVA)
	cp -p feed/silva/out/taxonomy.tsv $(SILVA)/
	cp -p feed/silva/out/synonyms.tsv $(SILVA)/
	cp -p feed/silva/about.json $(SILVA)/

feed/silva/in/accessionid_to_taxonid.tsv: feed/silva/accessionid_to_taxonid.tsv
	(cd `dirname $@` && ln -sf ../accessionid_to_taxonid.tsv ./)

# Silva 115: 206M uncompresses to 817M

feed/silva/in/silva.fasta:
	mkdir -p `basename $@`
	wget --output-document=feed/silva/in/tax_ranks.txt \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/tax_ranks_ssu_115.txt
	wget --output-document=feed/silva/in/silva.fasta.tgz \
	  https://www.arb-silva.de/fileadmin/silva_databases/release_115/Exports/SSURef_NR99_115_tax_silva.fasta.tgz
	(cd feed/silva/in && tar xzvf silva.fasta.tgz && mv *silva.fasta silva.fasta)

TARDIR=/raid/www/roots/opentree/ott

tarball: tax/ott/log.tsv
	(cd tax && \
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

# Nematode test
CP=-classpath ".:lib/*"
JAVA_ARGS=$(CP) -Xmx12G
TEST_ARGS=Smasher tax/nem_ncbi/ tax/nem_gbif/ \
      --edits feed/nem/edits/ \
      --ids tax/prev_nem/ \
      --out tax/nem/

# -----------------------------------------------------------------------------
# Test: nematodes

nem: tax/nem/log.tsv
tax/nem/log.tsv: Smasher.class tax/prev_nem/taxonomy.tsv tax/nem_ncbi/taxonomy.tsv tax/nem_gbif/taxonomy.tsv
	mkdir -p tax/nem/
	java $(JAVA_ARGS) $(TEST_ARGS)

# Inputs to the nem test

tax/nem_ncbi/taxonomy.tsv:
	mkdir -p `dirname $@`
	cp -p $(TAXOMACHINE_EXAMPLE)/nematoda.ncbi $@

tax/nem_gbif/taxonomy.tsv:
	mkdir -p `dirname $@`
	cp -p $(TAXOMACHINE_EXAMPLE)/nematoda.gbif $@

# little test of --select feature
tax/nem_dory/taxonomy.tsv: tax/nem/log.tsv Smasher.class
	mkdir -p `dirname $@`
	java $(JAVA_ARGS) Smasher --start tax/nem/ --select Dorylaimina tax/nem_dory/

# -----------------------------------------------------------------------------
# Microcosm: Campanulinidae

TAXON=Asterales #wants to be campanulinids

t/tax/prev/taxonomy.tsv: tax/prev_ott/taxonomy.tsv
	mkdir -p `dirname $@`
	java $(JAVA_ARGS) Smasher tax/prev_ott/ --select $(TAXON) t/tax/prev/

t/tax/ncbi/taxonomy.tsv: tax/ncbi/taxonomy.tsv
	mkdir -p `dirname $@`
	java $(JAVA_ARGS) Smasher tax/ncbi/ --select $(TAXON) t/tax/ncbi/

t/tax/gbif/taxonomy.tsv: tax/gbif/taxonomy.tsv
	mkdir -p `dirname $@`
	java $(JAVA_ARGS) Smasher tax/gbif/ --select $(TAXON) t/tax/gbif/

t/tax/camp/taxonomy.tsv: Smasher.class \
			 t/tax/prev/taxonomy.tsv \
			 t/tax/ncbi/taxonomy.tsv \
			 t/tax/gbif/taxonomy.tsv
	mkdir -p `dirname $@`
	java $(JAVA_ARGS) Smasher t/tax/ncbi/ t/tax/gbif/ \
	     --ids t/tax/prev/ \
	     --out t/tax/camp/

camp: t/tax/camp/taxonomy.tsv
