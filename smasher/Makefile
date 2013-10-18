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

# Working area (temporary, unversioned)
WORK=tmp

CP=-classpath .:jscheme.jar
TEST_ARGS=Smasher $(TAXOMACHINE_ROOT)/example/nematoda.ncbi $(TAXOMACHINE_ROOT)/example/nematoda.gbif \
      --edits nem-edits/ \
      --ids $(WORK)/nem1.ott \
      --aux $(WORK)/nem1.preottol \
      --out $(WORK)/nem2/

NCBI=$(WORK)/ncbi.processed
GBIF=$(WORK)/gbif.processed

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

ott22: $(WORK)/ott2.2/log
$(WORK)/ott2.2/log: Smasher.class $(NCBI) $(GBIF) $(PREOTTOL)/preottol-20121112.processed 
	mkdir -p $(WORK)/ott2.2
	java $(CP) -Xmx10g $(OTT22_ARGS)

OTT21_ARGS=Smasher $(NCBI) $(GBIF) \
      --edits edits/ \
      --ids $(WORK)/ott2.0/taxonomy \
      --aux $(PREOTTOL)/preottol-20121112.processed \
      --out $(WORK)/ott2.1/

ott21: $(WORK)/ott2.1/log
$(WORK)/ott2.1/log: Smasher.class $(NCBI) $(GBIF) $(PREOTTOL)/preottol-20121112.processed 
	mkdir -p $(WORK)/ott2.1
	java $(CP) -Xmx10g $(OTT21_ARGS)

OTT20_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids \
      --aux $(PREOTTOL)/preottol-20121112.processed \
      --out $(WORK)/ott2.0/

# 2.0 idempotency test
IDEM_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(WORK)/ott2.0/taxonomy \
      --out $(WORK)/ott2.0-idem/


ott20: $(WORK)/ott2.0/log
$(WORK)/ott2.0/log: Smasher.class $(NCBI) $(GBIF) $(PREOTTOL)/preottol-20121112.processed 
	mkdir -p $(WORK)/ott2.0
	java $(CP) -Xmx10g $(OTT20_ARGS)

idem: $(WORK)/ott2.0-idem/log
$(WORK)/ott2.0-idem/log: Smasher.class
	mkdir -p $(WORK)/ott2.0-idem
	java $(CP) -Xmx10g $(IDEM_ARGS)

# little test
$(WORK)/dory.foo: $(WORK)/nem2/taxonomy Smasher.class
	java $(CP) Smasher --start $< --select Dorylaimida $@

$(WORK)/nem1.preottol: $(PREOTTOL)/preottol-20121112.processed
	mkdir -p $(WORK)
	java $(CP) -Xmx3g Smasher --start $< --select Nematoda $@

$(WORK)/nem1.ott: $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids
	java $(CP) -Xmx3g Smasher --start $< --select Nematoda $@

$(PREOTTOL)/preottol-20121112.processed: $(PREOTTOL)/preOTToL_20121112.txt
	python process-preottol.py $< $@

# Formerly, where we now have /dev/null, we had
# ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP

ncbi: $(NCBI)
$(NCBI): $(WORK)/ncbi/nodes.dmp process_ncbi_taxonomy_taxdump.py
	python process_ncbi_taxonomy_taxdump.py F $(WORK)/ncbi \
            /dev/null $@.tmp
	mv -f $@.tmp $@
	mv -f $@.tmp.synonyms $@.synonyms

$(WORK)/ncbi/taxdump.tar.gz:
	mkdir -p $(WORK)/ncbi
	wget --output-document=$(WORK)/ncbi/taxdump.tar.gz \
 	     ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz

$(WORK)/ncbi/nodes.dmp: $(WORK)/ncbi/taxdump.tar.gz
	tar -C $(WORK)/ncbi -xzvf $(WORK)/ncbi/taxdump.tar.gz
	touch $(WORK)/ncbi/*.dmp

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

TARDIR=/raid/www/roots/opentree/ott

tarball: $(WORK)/$(WHICH)/log
	(cd $(WORK) && \
	 tar czvf $(TARDIR)/$(WHICH).tgz.tmp $(WHICH) && \
	 mv $(TARDIR)/$(WHICH).tgz.tmp $(TARDIR)/$(WHICH).tgz)

norbert:
	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher
