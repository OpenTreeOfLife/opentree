# The tests work in JAR's setup...

#  $^ = all prerequisites
#  $< = first prerequisite
#  $@ = file name of target

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

CP=-classpath .
TEST_ARGS=Smasher $(TAXOMACHINE_ROOT)/example/nematoda.ncbi $(TAXOMACHINE_ROOT)/example/nematoda.gbif \
      --ids $(WORK)/nem1.ott \
      --aux $(WORK)/nem1.preottol \
      --out $(WORK)/nem2/

NCBI=$(WORK)/ncbi.processed
GBIF=$(WORK)/gbif.processed

OTT20_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids \
      --aux $(PREOTTOL)/preottol-20121112.processed \
      --out $(WORK)/ott2.0/

# 2.0 idempotency test
IDEM_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(WORK)/ott2.0/taxonomy \
      --out $(WORK)/ott2.0-idempotency-test

OTT21_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids \
      --aux $(PREOTTOL)/preottol-20121112.processed \
      --out $(WORK)/ott2.0/


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

ott20: $(WORK)/ott2.0/log
$(WORK)/ott2.0/log: Smasher.class $(NCBI) $(PREOTTOL)/preottol-20121112.processed 
	mkdir -p $(WORK)/ott2.0
	java $(CP) -Xmx10g $(OTT20_ARGS)

idem: $(WORK)/ott2.1.log
$(WORK)/ott2.1.log: Smasher.class
	mkdir -p $(WORK)/ott2.1
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

$(NCBI): $(WORK)/ncbi/nodes.dmp process_ncbi_taxonomy_taxdump.py
	python process_ncbi_taxonomy_taxdump.py F $(WORK)/ncbi \
            ../data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP $@.tmp
	mv -f $@.tmp $@

$(WORK)/ncbi/taxdump.tar.gz:
	mkdir -p $(WORK)/ncbi
	wget --output-document=$(WORK)/ncbi/taxdump.tar.gz \
 	     ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz

$(WORK)/ncbi/nodes.dmp: $(WORK)/ncbi/taxdump.tar.gz
	tar -C $(WORK)/ncbi -xzvf $(WORK)/ncbi/taxdump.tar.gz

 $(GBIF): $(WORK)/gbif/taxon.txt ../data/process_gbif_taxonomy.py
	python ../data/process_gbif_taxonomy.py \
	       $(WORK)/gbif/taxon.txt \
	       ../data/gbif/ignore.txt $@.tmp
	mv -f $@.tmp $@

$(WORK)/gbif/taxon.txt:
	mkdir -p $(WORK)/gbif
	wget --output-document=$(WORK)/gbif/checklist1.zip \
             http://ecat-dev.gbif.org/repository/export/checklist1.zip
	(cd $(WORK)/gbif && unzip checklist1.zip)

tarball: $(WORK)/ott2.0/log
	(cd $(WORK) && tar czvf /raid/www/roots/opentree/ott2.0/ott2.0.tgz ott2.0)

norbert:
	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher
