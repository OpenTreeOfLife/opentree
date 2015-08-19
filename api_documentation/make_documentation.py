#!/usr/bin/env python

from Documentation import Builder
import graph, studies, taxonomy, tnrs, tree_of_life, tree_collections
import sys
d = Builder()

def write_markdown(out, method_group):
    d.write_methods_summary(out, method_group)
    for m in method_group.methods_list:
        d.write_method_details(out, m)

out = sys.stdout
out.write(d.get_doc_preamble([tree_of_life,graph,tnrs,taxonomy,studies,tree_collections]))
out.write('\n')
write_markdown(out, tree_of_life)
write_markdown(out, graph)
write_markdown(out, tnrs)
write_markdown(out, taxonomy)
write_markdown(out, studies)
write_markdown(out, tree_collections)
out.write(d.get_doc_postamble())
out.write('\n')
