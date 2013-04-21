# The tests work in JAR's setup...

# Root of taxomachine git repo
TAXOMACHINE_ROOT=../../taxomachine

# Root of 'ottol' directory (from
#  https://bitbucket.org/blackrim/avatol-taxonomies/downloads#download-155949 )
# for initial ottol ids and regression testing
OTTOL=../../ottol

# Working area (temporary, unversioned)
WORK=tmp

CP=-classpath .
ARGS=Smasher $(TAXOMACHINE_ROOT)/example/nematoda.ncbi $(TAXOMACHINE_ROOT)/example/nematoda.gbif \
      --ids t/nem-example.dump \
      --dump $(WORK)/nem2.dump --log $(WORK)/nem2.log

PROD=Smasher $(WORK)/ncbi.processed $(WORK)/gbif.processed \
      --ids $(OTTOL)/ottol_dump_w_uniquenames_preottol_ids \
      --dump $(WORK)/ottol2.dump --log $(WORK)/ottol2.log

compile: Smasher.class

Smasher.class: Smasher.java
	javac $(CP) -g Smasher.java

test: Smasher.class
	mkdir -p $(WORK)
	java $(CP) $(ARGS)

debug:
	mkdir -p $(WORK)
	jdb $(CP) $(ARGS)

prod: Smasher.class
	mkdir -p $(WORK)
	java $(CP) $(PROD)

norbert:
	rsync -vaxH --exclude="*.out" ./ norbert.csail.mit.edu:/raid/jar/NESCent/taxo
