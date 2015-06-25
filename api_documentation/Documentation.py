import pycurl
import json
import shlex
import subprocess
from StringIO import StringIO

class Builder(object):
    def __init__(self):
        self.json_storage = StringIO()
        self.c = pycurl.Curl()
    def _update_json_storage(self, url):
        self.json_storage.truncate(0)
        self.c.setopt(self.c.URL, url)
        self.c.setopt(self.c.HTTPHEADER, ["Content-type:Application/json"])
        self.c.setopt(self.c.WRITEFUNCTION, self.json_storage.write)
        self.c.perform()
    def get_doc_postamble(self):
        return _DOC_PREAMBLE_TEMPLATE
    def get_doc_preamble(self, method_groups):
        out = StringIO()
        self.write_doc_preamble(out, method_groups)
        return out.getvalue()
    def get_method_details(self, method_info):
        out = StringIO()
        self.write_method_details(out, method_info)
        return out.getvalue()
    def get_methods_summary(self, method_group):
        out = StringIO()
        self.write_methods_summary(out, method_group)
        return out.getvalue()
    def write_method_details(self, out, method_info):
        # process information from the neo4j web service info, if any
        if method_info.get('deprecated'):
            out.write(_ANCHOR_TITLE_TEMPLATE.format(**method_info))
            templ = 'The method "{m[method_name]}" has been deprecated.\n\n'
            out.write(templ.format(m=method_info))
            sd = method_info.get('short_description')
            if sd:
                out.write(sd + '\n\n')
        else:
            if "neo4j_service_url" in method_info and method_info["neo4j_service_url"] is not None:
                self._update_json_storage(method_info["neo4j_service_url"])
                service_info = json.loads(self.json_storage.getvalue())
                method_info["long_description"] = service_info["description"]
            # just a kludge to keep from failing if there is no description
            method_info["long_description"] = method_info.get("long_description", '')
            # get the results of the example call if possible
            e = shlex.split(method_info["example_command"].replace("\\\n",""))
            if e is not None and len(e) > 0:
                r = subprocess.Popen(e,stdout=subprocess.PIPE)
                res = r.communicate()[0]
                method_info["example_result"] = res
            # now print the preamble
            out.write(_METHOD_PREAMBLE_TEMPLATE.format(**method_info))
            # and the example
            out.write(_METHOD_EXAMPLE_TEMPLATE.format(**method_info))
        link_outs = method_info.get('further_info', [])
        if link_outs:
            out.write('\n##### For further information\n\n')
            for li in link_outs:
                out.write('  * [{l[link_name]}]({l[url]})\n\n'.format(l=li))
    def write_methods_summary(self, out, method_group):
        out.write("## <a name='{g.anchor_name}'></a>{g.title}\n".format(g=method_group))
        out.write(method_group.long_description + "\n\n")
        TABLE_HEADER = """| URL                                        | Verb   | Summary                |
| -------------------------------------------|--------|------------------------|
"""
        out.write(TABLE_HEADER)
        active_templ = "|[`{m[relative_url]}`](#{m[anchor_name]}) | {m[http_verb]} | {m[short_description]} |\n"
        for m in method_group.methods_list:
            if not m.get('deprecated'):
                out.write(active_templ.format(m=m));
        dep = [i for i in method_group.methods_list if i.get('deprecated')]
        if dep:
            out.write('\n\n*Deprecated methods*\n')
            out.write(TABLE_HEADER)
            deprecated_templ = "|[`{m[relative_url]}`](#{m[anchor_name]}) |     | *Deprecated*: {m[short_description]} |\n"
            for m in dep:
                out.write(deprecated_templ.format(m=m));
        out.write('\n')
    def write_doc_preamble(self, out, method_groups):
        template = "**[{g.title}](#{g.anchor_name})** : {g.short_description}.\n\n"
        mgm = ''.join([template.format(g=g) for g in method_groups])
        out.write(_DOC_PREAMBLE_TEMPLATE.format(method_groups=mgm))

_DOC_PREAMBLE_TEMPLATE = """ Do not edit this page! The API documentation is automatically generated using code 
in [the opentree repo](http://github.com/OpenTreeOfLife/opentree/tree/master/api_documentation). If you have 
a suggestion to improve this documentation, please submit an issue on the
[feedback repo](http://github.com/OpenTreeOfLife/feedback/issues).

This documentation describes version 2.0 of the Open Tree of Life APIs. There is also documentation 
for [version 1.0](https://github.com/OpenTreeOfLife/opentree/wiki/Open-Tree-of-Life-APIs-V1), which 
is still active but is deprecated and will eventually be retired.

The Open Tree of Life APIs include services to access the following types of data:

{method_groups}

The base URL for all services:

	http://api.opentreeoflife.org/v2

**Caveats**

* the JSON return values are not consistent between software components. We are working to standardize on the
documented [NexSON](http://purl.org/opentree/nexson) format.
* [neo4j](http://neo4j.org) implements POST for some methods that really should be GET.

**Questions / Comments**

If you have questions, or have a problem with any of these methods, please leave an issue in 
the [feedback issue tracker](https://github.com/OpenTreeOfLife/feedback/issues).

"""

_ANCHOR_TITLE_TEMPLATE = """### <a name="{anchor_name}"></a>{method_name}
"""
_METHOD_PREAMBLE_TEMPLATE = _ANCHOR_TITLE_TEMPLATE + """
*{short_description}*

```
{http_verb}    {relative_url}
```

{long_description}

##### Parameters:\n
*Parameters with bold type definitions are required.*

"""

_METHOD_EXAMPLE_TEMPLATE = """*Example command:*

```bash
$ {example_command}
```

*Example result:*    
```json
{example_result}
```

"""

_DOC_POSTAMBLE_TEMPLATE = """## Other API docs
The following links provide information about ongoing development: methods being tested, developed or discussed.  

* [documentation of the datastore API](https://github.com/OpenTreeOfLife/phylesystem-api/blob/master/docs/README.md)
* [list of neo4j methods](https://github.com/OpenTreeOfLife/opentree/blob/master/neo4j_services_docs.md)
* [Python library for interacting with OpenTree APIs](https://github.com/OpenTreeOfLife/peyotl)
* [Overview of methods used internally between OpenTree components](https://github.com/OpenTreeOfLife/phylesystem-api/wiki/overview-of-open-tree-of-life-api-calls)

If you have questions or feedback, leave an[issue on GitHub](https://github.com/OpenTreeOfLife/feedback/issues)
or join us on IRC on the #opentreeoflife channel on [Freenode](http://freenode.net/).
"""
