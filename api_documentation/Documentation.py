import pycurl, json
from StringIO import StringIO

class builder:

    def __init__(self):
        self.json_storage = StringIO()
        self.c = pycurl.Curl()    

    def _update_json_storage(self, url):
        self.json_storage.truncate(0)
        self.c.setopt(self.c.URL, url)
        self.c.setopt(self.c.HTTPHEADER, ["Content-type:Application/json"])
        self.c.setopt(self.c.WRITEFUNCTION, self.json_storage.write)
        self.c.perform()
    
    def get_detailed_methods_list(self, method_info):

        markdown = StringIO()
        
        # if we received a parameters list, use it, otherwise initialize it
        parameters = parameters if "parameters" in locals() else {}

        # process information from the neo4j web service info, if any        
        if "neo4j_service_url" in method_info and method_info["neo4j_service_url"] is not None:
            self._update_json_storage(method_info["neo4j_service_url"])
#            print self.json_storage.getvalue()
            service_info = json.loads(self.json_storage.getvalue())
            method_info["long_description"] = service_info["description"]
    
            # process neo4j parameters
            for p in service_info["parameters"]:
                parameters[p["name"]] = p
                
        # just a kludge to keep from failing if there is no description
        method_info["long_description"] = method_info["long_description"] if "long_description" in method_info else ""     

        # process parameters for printing
        required_keys = []
        optional_keys = []
        for name, p in parameters.iteritems():
            if p["optional"] == True:
                p["style_modifier"] = ""
                optional_keys.append(name)
            else:
                p["style_modifier"] = "**"
                required_keys.append(name)

        # now print the preamble
        markdown.write(self.method_preamble_template.format(**method_info))

        # and the parameters
        for key_set in [sorted(required_keys), sorted(optional_keys)]:
            for p in key_set:
                markdown.write(self.method_parameter_template.format(**parameters[p]))

        # and the example
        markdown.write(self.method_example_template.format(**method_info))
        
        return markdown.getvalue()

    def get_methods_summary(self, method_group):
    
        markdown = StringIO()

        markdown.write("## <a name='{g.anchor_name}'></a>{g.title}\n".format(g=method_group))
        markdown.write(method_group.long_description+"\n\n")
        markdown.write("| URL                                        | Verb   | Summary                |\n");
        markdown.write("| -------------------------------------------|--------|------------------------|\n");

        for m in method_group.methods_list:
            markdown.write("|[`{m[relative_url]}`](#{m[anchor_name]}) | {m[http_verb]} | {m[short_description]} |\n".format(m=m));

        return markdown.getvalue()            

    def get_doc_preamble(self, method_groups):

        markdown = StringIO()
        
        mgm = ""
        for g in method_groups:
            mgm += self.method_group_list_item_template.format(g=g)
        markdown.write(self.doc_preamble_template.format(method_groups=mgm))

        return markdown.getvalue()        
    
    def get_doc_postamble(self):
        return self.doc_postamble_template
    
    doc_preamble_template = """**Warning: this is a draft version undergoing heavy revision on the week of September 8, 2014**

This documentation describes version 2.0 of the Open Tree of Life APIs. There is also documentation for [version 1.0](https://github.com/OpenTreeOfLife/opentree/wiki/Open-Tree-of-Life-APIs-V1), which is still active but is deprecated and will eventually be retired.  

The Open Tree of Life APIs include services to access the following types of data:

{method_groups}

The base URL for all services:

	http://api.opentreeoflife.org/v2

**Caveats**

* the JSON return values are not consistent between software components. We are working to standardize on the documented [NexSON](http://purl.org/opentree/nexson) format.  
* [neo4j](http://neo4j.org) implements POST for some methods that really should be GET.  

**Questions / Comments**

If you have questions, or have a problem with any of these methods, please leave an issue in the [feedback issue tracker](https://github.com/OpenTreeOfLife/feedback/issues).\n\n"""

    method_group_list_item_template = """**[{g.title}](#{g.anchor_name})** : {g.short_description}.\n\n"""

    method_preamble_template = """### <a name="{anchor_name}"></a>{method_name}

*{short_description}*

```
{http_verb}    {relative_url}
```

{long_description}

##### Parameters:\n\n"""

    method_parameter_template = """{style_modifier}```{name}``` : {type}{style_modifier}<br/>
{description}\n\n"""

    method_example_template = """*Example:*

```bash
$ {example_command}
```
    
```json
{example_result}
```\n\n"""

    doc_postamble_template = """## Other API docs
The following links provide information about ongoing development: methods being tested, developed or discussed.  

* [documentation of the datastore API](https://github.com/OpenTreeOfLife/phylesystem-api/blob/master/docs/README.md)
* [list of neo4j methods](https://github.com/OpenTreeOfLife/opentree/blob/master/neo4j_services_docs.md)
* [Python library for interacting with OpenTree APIs](https://github.com/OpenTreeOfLife/peyotl)
* [Overview of methods used internally between OpenTree components](https://github.com/OpenTreeOfLife/phylesystem-api/wiki/overview-of-open-tree-of-life-api-calls)

If you have questions or feedback, leave an [issue on GitHub](https://github.com/OpenTreeOfLife/feedback/issues) or join us on IRC on the #opentreeoflife channel on [Freenode](http://freenode.net/)."""
