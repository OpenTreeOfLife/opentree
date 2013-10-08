# The wget command takes about a minute to run
time wget -O ids_report.csv "http://reelab.net/phylografter/ottol/ottol_names_report.csv/" 
tr "," "	" <ids_report.csv >ids_report.tab

# java -classpath . Smasher --join ids_report.tab tmp/ott2.2/deprecated >tmp/used-but-deprecated-5.txt 
