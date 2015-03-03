#!/usr/bin/env python

from Documentation import builder
import graph, studies, taxonomy, tnrs, tree_of_life, tree_collections

d = builder()

def print_markdown(method_group):
    print(d.get_methods_summary(method_group))

    for m in method_group.methods_list:
        print(d.get_detailed_methods_list(m))

print(d.get_doc_preamble([tree_of_life,graph,tnrs,taxonomy,studies,tree_collections]))
print_markdown(tree_of_life)
print_markdown(graph)
print_markdown(tnrs)
print_markdown(taxonomy)
print_markdown(studies)
print_markdown(tree_collections)
print(d.get_doc_postamble())
