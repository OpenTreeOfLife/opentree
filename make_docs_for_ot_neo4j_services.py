#!/usr/bin/env python

import pycurl, json
from StringIO import StringIO

def simple_curl_call(c, url, write_function):
    c.setopt(c.URL, url)
    c.setopt(c.HTTPHEADER, ["Content-type:Application/json"])
    c.setopt(c.WRITEFUNCTION, write_function)
    #c.setopt(c.POSTFIELDS, '')
    #c.setopt(c.VERBOSE, True)
    c.perform()
    
def print_description(service_url):
    
    print "#### " + service_name
    print "\n\t" + service_url + "\n"
    
    simple_curl_call(c, str(service_url), storage2.write)

    service_info = json.loads(storage2.getvalue())

    print service_info["description"] + "\n"
    
    optional_pars = {}
    required_pars = {}
    
    for par_info in service_info["parameters"]:
        if par_info["optional"] == True:
            optional_pars[par_info["name"]] = par_info
        else:
            required_pars[par_info["name"]] = par_info
        
    sorted_keys = required_pars.keys()
    sorted_keys.sort()
    
    for par_name in sorted_keys:
        print "*\t" + par_name + ": " + required_pars[par_name]["description"]

    sorted_keys = optional_pars.keys()
    sorted_keys.sort()

    for par_name in sorted_keys:
        print "*\t*" + par_name + "*: " + optional_pars[par_name]["description"]
    
    print ""
    
    storage2.truncate(0)


taxomachine_url = "http://dev.opentreeoflife.org/taxomachine/"
treemachine_url = "http://dev.opentreeoflife.org/treemachine/"
oti_url = "http://dev.opentreeoflife.org/oti/"

c = pycurl.Curl()
storage = StringIO()
storage2 = StringIO()

##### first, taxomachine

print "# taxomachine"
print "The taxonomy database of the Open Tree of Life project. Services are provided for taxonomic name resolution (TNRS), as well as direct methods of accessing the taxonomy itself. For more information on neo4j services for this database, execute this line in a terminal:"
print "\n\tcurl -v " + taxomachine_url + " \n"

simple_curl_call(c, taxomachine_url, storage.write)
taxomachine_services_info = json.loads(storage.getvalue())

print "### Available taxomachine service extensions:"

for ext, services in taxomachine_services_info["extensions"].iteritems():
    
    for service_name, service_url in services.iteritems():
        
        service_url = service_url.replace(":7476/db/data", "/taxomachine")        
        print_description(service_url)

# reset the curl output buffer
storage.truncate(0)

##### next, treemachine

print "# treemachine"
print "The phylogeny database of the Open Tree of Life project. Services are provided for getting information about the source trees, accessing individual source trees, accessing the synthetic draft tree of life, and other various tasks. For more information on neo4j services for this database, execute this line in a terminal:"
print "\n\tcurl -v " + treemachine_url + " \n"

simple_curl_call(c, treemachine_url, storage.write)
treemachine_services_info = json.loads(storage.getvalue())

print "### Available treemachine service extensions:"

for ext, services in treemachine_services_info["extensions"].iteritems():
    
    for service_name, service_url in services.iteritems():
        
        service_url = service_url.replace(":7474/db/data", "/treemachine")        
        print_description(service_url)

# reset the curl output buffer
storage.truncate(0)

##### next, oti

print "# oti"
print "OTI is an indexing service for the NEXSoN studies available through the Open Tree of Life phylesystem. For more information on neo4j services for this database, execute this line in a terminal:"
print "\n\tcurl -v " + oti_url + " \n"

simple_curl_call(c, oti_url, storage.write)
oti_services_info = json.loads(storage.getvalue())

print "### Available oti service extensions:"

for ext, services in oti_services_info["extensions"].iteritems():
    
    for service_name, service_url in services.iteritems():
        
        service_url = service_url.replace(":7478/db/data", "/oti")        
        print_description(service_url)

# close buffers
c.close()
storage.close()
storage2.close()
