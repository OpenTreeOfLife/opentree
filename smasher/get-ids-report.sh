#!/bin/bash

# The wget command takes about a minute to run
time wget -O ids_report.csv "http://reelab.net/phylografter/ottol/ottol_names_report.csv/" 
tr "," "	" <ids_report.csv >ids_report.tab

alias smash='java -classpath ".:lib/*" Smasher'
# smash --join ids_report.tab tax/ott/deprecated.tsv >used-but-deprecated.txt 
