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

NCBI=$(WORK)/ncbi_with_unclassified.txt
#NCBI=$(WORK)/ncbi.processed
GBIF=$(WORK)/gbif.processed

PROD_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids \
      --aux $(PREOTTOL)/preottol-20121112.processed \
      --out $(WORK)/ott2/

# Idempotency test
IDEM_ARGS=Smasher $(NCBI) $(GBIF) \
      --ids $(WORK)/ott2/taxonomy \
      --out $(WORK)/ott3/

compile: Smasher.class

Smasher.class: Smasher.java
	javac $(CP) -g Smasher.java

test: $(WORK)/nem2/log
$(WORK)/nem2/log: Smasher.class $(WORK)/nem1.preottol
	mkdir -p $(WORK)/nem2/
	java $(CP) $(TEST_ARGS)

debug:
	mkdir -p $(WORK)
	jdb $(CP) $(TEST_ARGS)

prod: $(WORK)/ott2.log
$(WORK)/ott2.log: Smasher.class $(PREOTTOL)/preottol-20121112.processed 
	mkdir -p $(WORK)/ott2
	java $(CP) -Xmx10g $(PROD_ARGS)

idem: $(WORK)/ott3.log
$(WORK)/ott3.log: Smasher.class
	mkdir -p $(WORK)/ott3
	java $(CP) -Xmx10g $(IDEM_ARGS)

# little test
$(WORK)/dory.foo: $(WORK)/nem2/taxonomy Smasher.class
	java $(CP) Smasher --start $< --select Dorylaimida $@

$(WORK)/nem1.preottol: $(PREOTTOL)/preottol-20121112.processed
	java $(CP) -Xmx3g Smasher --start $< --select Nematoda $@

$(WORK)/nem1.ott: $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids
	java $(CP) -Xmx3g Smasher --start $< --select Nematoda $@

$(PREOTTOL)/preottol-20121112.processed: $(PREOTTOL)/preOTToL_20121112.txt
	python process-preottol.py $< $@

$(WORK)/ncbi_with_unclassified.txt: $(WORK)/ncbi/nodes.dmp
	(cd $(WORK)/ncbi; \
	 python ../../taxomachine/data/process_ncbi_taxonomy_taxdump.py F \
           ../../../taxomachine/data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP $@)

$(WORK)/ncbi/nodes.dmp:
	mkdir -p $(WORK)/ncbi
	(cd $(WORK)/ncbi; \
         wget ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz ; \
         tar -xzvf taxdump.tar.gz)

norbert:
	rsync -vaxH --exclude=$(WORK) --exclude="*~" --exclude=backup \
           ./ norbert.csail.mit.edu:/raid/jar/NESCent/opentree/smasher
