#!/usr/bin/env python

from Documentation import builder
import graph, studies, taxonomy, tnrs, tree_of_life, tree_collections

def write_markdown(out, method_group):
    d.write_methods_summary(out, method_group)
    for m in method_group.methods_list:
        d.write_method_details(out, m)

out = sys.stdout
out.write(d.get_doc_preamble([tree_of_life,graph,tnrs,taxonomy,studies]))
out.write('\n')
write_markdown(out, tree_of_life)
write_markdown(out, graph)
write_markdown(out, tnrs)
write_markdown(out, taxonomy)
write_markdown(out, studies)
out.write(d.get_doc_postamble())
out.write('\n')

print(d.get_doc_preamble([tree_of_life,graph,tnrs,taxonomy,studies,tree_collections]))
print_markdown(tree_of_life)
print_markdown(graph)
print_markdown(tnrs)
print_markdown(taxonomy)
print_markdown(studies)
print_markdown(tree_collections)
print(d.get_doc_postamble())
