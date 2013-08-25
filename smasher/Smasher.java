/*

  JAR's taxonomy combiner.

  Some people think having multiple classes in one file, or unpackaged
  classes, is terrible programming style...	 I'll split into multiple
  files when I'm ready to do so; currently it's much easier to work
  with in this form.


   Stephen's instructions
	https://github.com/OpenTreeOfLife/taxomachine/wiki/Loading-the-OTToL-working-taxonomy
	  addtax
		TaxonomyLoader.addDisconnectedTaxonomyToGraph
	  graftbycomp
		TaxonomyComparator.compareGraftTaxonomyToDominant
		  search for matching nodes is bottom up

   NCBI
	python ../../taxomachine/data/process_ncbi_taxonomy_taxdump.py F \
		   ../../taxomachine/data/ncbi/ncbi.taxonomy.homonym.ids.MANUAL_KEEP ncbi.processed
	  ~/Downloads/taxdump.tar.gz   25054982 = 25,054,982 bytes
	  data/nodes.dmp  etc.
	  data/ncbi.processed  (34M)
	  1 minute 9 seconds

   GBIF
	~/Downloads/gbif/taxon.txt
	python ../../taxomachine/data/process_gbif_taxonomy.py \
		   ~/Downloads/gbif/taxon.txt \
		   ../../taxomachine/data/gbif/ignore.txt \
		   gbif.processed
	  4 minutes 55 seconds

   OTTOL
   https://bitbucket.org/blackrim/avatol-taxonomies/downloads#download-155949
   ~/Downloads/ottol/ottol_dump_w_uniquenames_preottol_ids	(158M)
					 ottol_dump.synonyms			
	 header line:
		uid	|	parent_uid	|	name	|	rank	|	source	|	sourceid
	 |	sourcepid	|	uniqname	|	preottol_id	|	
	 source = ncbi or gbif

   PREOTTOL
   ~/a/NESCent/preottol/preottol-20121112.processed

*/

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.StringTokenizer;
import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.Iterator;
import java.util.Comparator;
import java.util.Collections;
import java.util.Collection;
import java.io.PrintStream;
import java.io.File;

public class Smasher {

	public static void main(String argv[]) throws Exception {

		Taxonomy.initRanks();

		if (argv.length > 0) {

			UnionTaxonomy union = new UnionTaxonomy();
			boolean anyfile = false;
			Node.windyp = false;
			SourceTaxonomy idsource = null;
			String outprefix = null;

			for (int i = 0; i < argv.length; ++i) {

				if (argv[i].startsWith("--")) {

					if (argv[i].equals("--jscheme")) {
						String[] jargs = {};
						jscheme.REPL.main(jargs);
					}

					else if (argv[i].equals("--ids")) {
						idsource = getSourceTaxonomy(argv[++i]);
						union.assignIds(idsource);
					}

					else if (argv[i].equals("--aux")) { // preottol
						union.auxsource = getSourceTaxonomy(argv[++i]);
						union.loadAuxIds(union.auxsource, idsource);
					}

					else if (argv[i].equals("--start"))
						getTaxonomy(union, argv[++i]);

					else if (argv[i].equals("--select")) {
						String name = argv[++i];
						union.dump(union.unique(name), argv[++i]);
					}

					else if (argv[i].equals("--edits")) {
						String dirname = argv[++i];
						union.edit(dirname);
					}

					//-----
					else if (argv[i].equals("--out")) {
						outprefix = argv[++i];
						union.dumpAll(outprefix);
					}

					/*

					  else if (argv[i].equals("--dump"))
						union.dump(union.root, argv[++i]);

					else if (argv[i].equals("--log")) {
						if (++i < argv.length)
							union.dumpLog(argv[i]);
						else
							System.err.println("Missing file name for --log");
					}
					else if (argv[i].equals("--deprecated"))
						union.dumpDeprecated(idsource, argv[++i]);
					//-----
					*/

					else if (argv[i].equals("--test"))
						test();

					else if (argv[i].equals("--newick"))
						System.out.println(" -> " + union.toNewick());

					// Utility
					else if (argv[i].equals("--join")) {
						String afile = argv[++i];
						String bfile = argv[++i];
						join(afile, bfile);
					}

					else System.err.println("Unrecognized directive: " + argv[i]);
				}

				else {
					union.mergeIn(getSourceTaxonomy(argv[i]));
					Node.windyp = true;
				}
			}
			union.finish();
		}
	}

	static SourceTaxonomy getSourceTaxonomy(String designator) throws IOException {
		SourceTaxonomy tax = new SourceTaxonomy();
		getTaxonomy(tax, designator);
		return tax;
	}

	static void getTaxonomy(Taxonomy tax, String designator) throws IOException {
		if (designator.startsWith("(")) {
			tax.root = tax.newickToNode(designator);
		} else {
			System.out.println("--- Reading " + designator + " ---");
			tax.root = tax.loadTaxonomy(designator);
		}
		tax.investigateHomonyms();
	}

	static void test() {

		Taxonomy tax = SourceTaxonomy.parseNewick("(a,b,(e,f)c)d");
		for (Node node : tax)
			System.out.println(node);
	}

	static void join(String afile, String bfile) throws IOException {
		PrintStream out = System.out;
		Map<Long, String[]> a = readTable(afile);
		Map<Long, String[]> b = readTable(bfile);
		for (Long id : a.keySet()) {
			String[] brow = b.get(id);
			if (brow != null) {
				boolean first = true;
				String[] arow = a.get(id);
				for (int i = 0; i < arow.length; ++i) {
					if (!first) out.print("\t"); first = false;
					out.print(arow[i]);
				}
				for (int j = 1; j < brow.length; ++j) {
					if (!first) out.print("\t"); first = false;
					out.print(brow[j]);
				}
				out.println();
			}
		}
	}

	static Pattern tabPattern = Pattern.compile("\t");

	static Map<Long, String[]> readTable(String filename) throws IOException {
		FileReader fr = new FileReader(filename);
		BufferedReader br = new BufferedReader(fr);
		String str;
		Map<Long, String[]> rows = new HashMap<Long, String[]>();
		while ((str = br.readLine()) != null) {
			String[] parts = tabPattern.split(str);
			Long id;
			try {
				id = new Long(parts[0]);
			} catch (NumberFormatException e) {
				continue;
			}
			rows.put(id, parts);
		}
		fr.close();
		return rows;
	}
}

class Taxonomy implements Iterable<Node> {
	Map<String, List<Node>> nameIndex = new HashMap<String, List<Node>>();
	Map<Long, Node> idIndex = new HashMap<Long, Node>();
	Map<String, List<Node>> synonyms = new HashMap<String, List<Node>>();
	boolean originp = false;
	Node root;
	int which = -1;
	long maxid = -1;
	protected String tag = null;
	static Long fakeIdCounter = -1L;
	int nextSequenceNumber = 0;
	String[] header = null;
	Map<String, Integer> headerx = new HashMap<String, Integer>();

	Integer sourcecolumn = -1;
	Integer sourceidcolumn = -1;
	Integer infocolumn = -1;

	Taxonomy() { }

	public String toString() {
		return "(taxonomy " + (tag != null ? tag : "?") + ")";
	}

	Node getRoot() {
		return root;
	}

	List<Node> lookup(String name) {
		List<Node> nodes = this.nameIndex.get(name);
		if (nodes != null) return nodes;
		// Consider appending synonyms ??
		return this.synonyms.get(name);
	}

	Node unique(String name) {
		List<Node> probe = this.nameIndex.get(name);
		if (probe != null && probe.size() == 1)
			return probe.get(0);
		else
			return null;
	}

	boolean homonymp(String name) {
		List<Node> probe = this.nameIndex.get(name);
		return probe != null && probe.size() > 1;
	}

	void addToIndex(Node node) {
		String name = node.name;
		List<Node> nodes = this.nameIndex.get(name);
		if (nodes == null) {
			nodes = new ArrayList<Node>(1); //default is 10
			this.nameIndex.put(name, nodes);
		}
		nodes.add(node);
	}

	int count() { return this.root.count(); }

	// Iterate over all nodes reachable from root

	public Iterator<Node> iterator() {
		final List<Iterator<Node>> its = new ArrayList<Iterator<Node>>();
		final Node[] current = new Node[1]; // locative
		current[0] = this.root;

		return new Iterator<Node>() {
			public boolean hasNext() {
				if (current[0] != null) return true;
				for (int z = its.size()-1; z >= 0; --z) {
					if (its.get(z).hasNext())
						return true;
					its.remove(z);
				}
				return false;
			}
			public Node next() {
				Node node = current[0];
				if (node != null)
					current[0] = null;
				else
					// Caller has previously called hasNext(), so we're good to go
					node = its.get(its.size()-1).next();
				if (node.children != null)
					its.add(node.children.iterator());
				return node;
			}
			public void remove() { throw new UnsupportedOperationException(); }
		};
	}

	String getTag() {
		if (this.tag == null) this.setTag();
		return this.tag;
	}

	void setTag() {
		List<Node> probe = this.lookup("Caenorhabditis elegans");
		if (probe == null)
			this.tag = "tax" + this.which;
		else {
			long id = (long)probe.get(0).id;
			if (id == 6239) this.tag = "ncbi";
			else if (id == 2283683) this.tag = "gbif";
			else if (id == 395048) this.tag = "ott";
			else if (id == 100968828) this.tag = "aux";
			else if (id == 4722) this.tag = "nem"; // testing
			else this.tag = "tax" + this.which;
		}
	}

	Node highest(String name) {
		Node best = null;
		List<Node> l = this.lookup(name);
		if (l != null) {
			int depth = 1 << 30;
			for (Node node : l)
				if (node.getDepth() < depth) {
					depth = node.getDepth();
					best = node;
				}
		}
		return best;
	}

	void investigateHomonyms() {
		int homs = 0;
		int sibhoms = 0;
		int cousinhoms = 0;
		for (List<Node> nodes : nameIndex.values())
			if (nodes.size() > 1) {
				++homs;
				for (Node n1: nodes)
					for (Node n2: nodes)
						if (n1.id < n2.id) {
							if (n1.parent == n2.parent)
								++sibhoms;
							else if (n1.parent.parent == n2.parent.parent)
								++cousinhoms;
						}
			}
		if (homs > 0) {
			System.out.println("| " + homs + " homonyms, " +
							   cousinhoms + " cousin pairs, " +
							   sibhoms + " sibling pairs");
		}
	}

	static Pattern tabVbarTab = Pattern.compile("\t\\|\t?");

	Node loadTaxonomy(String filename) throws IOException {
		FileReader fr = new FileReader(filename);
		BufferedReader br = new BufferedReader(fr);
		String str;
		int row = 0;
		Node root = null;

		while ((str = br.readLine()) != null) {
			String[] parts = tabVbarTab.split(str);
			if (parts.length < 3) {
				System.out.println("Bad row: " + row + " has " + parts.length + " parts");
			} else {
				// id | parentid | name | rank | ...
				try {
					Long id = new Long(parts[0]);
					Node node = this.idIndex.get(id);
					if (node == null) {
						node = new Node(this);
						node.setId(id); // stores into this.idIndex
					}
					if (parts[1].length() > 0) {
						Long parentId = new Long(parts[1]);
						Node parent = this.idIndex.get(parentId);
						if (parent == null) {
							parent = new Node(this);	 //don't know parent's name yet
							parent.setId(parentId);
						}
						parent.addChild(node);
					} else if (root != null) {
						node.report("Multiple roots", root);
					} else
						root = node;
					node.init(parts); // does setName
				} catch (NumberFormatException e) {
					this.header = parts; // Stow it just in case...
					for (int i = 0; i < parts.length; ++i)
						this.headerx.put(parts[i], i);

					Integer o1 = this.headerx.get("source");
					this.sourcecolumn = (o1 == null? -1 : o1);
					Integer o2 = this.headerx.get("sourceid");
					this.sourceidcolumn = (o2 == null? -1 : o2);
					Integer o3 = this.headerx.get("sourceinfo");
					this.infocolumn = (o3 == null? -1 : o3);

					continue;
				}
			}
			++row;
			if (row % 500000 == 0)
				System.out.println(row);
		}
		fr.close();

		if (root == null)
			System.err.println("*** No root node!");
		else if (row != root.count())
			System.err.println(this.getTag() + " is ill-formed: " +
							   row + " rows, " + 
							   root.count() + " reachable");

		loadSynonyms(filename);

		return root;
	}

	void loadSynonyms(String filename) throws IOException {
		FileReader fr;
		try {
			fr = new FileReader(filename + ".synonyms");
		} catch (java.io.FileNotFoundException e) {
			fr = null;
		}
		if (fr != null) {
			int count = 0;
			BufferedReader br = new BufferedReader(fr);
			String str;
			while ((str = br.readLine()) != null) {
				String[] parts = tabVbarTab.split(str);
				// 36602	|	Sorbus alnifolia	|	synonym	|	|	
				if (parts.length >= 2) {
					String syn = parts[1];
					Long id = new Long(parts[0]);
					List<Node> good = this.nameIndex.get(syn);
					Node node = this.idIndex.get(id);
					if (good != null) {
						if (false) {
							boolean foo = false;
							for (Node x : good)
								if (x == node) {foo=true; break;}
							if (!foo)
								System.err.println("syno-euo-homonym: " + id + " " + syn);
						}
						continue;
					}
					if (node == null) continue;
					List<Node> nodes = this.synonyms.get(syn);
					if (nodes == null) {
						nodes = new ArrayList<Node>(1);
						this.synonyms.put(syn, nodes);
					}
					// A single string can be a synonym for multiple taxa... I think...
					nodes.add(node);
					++count;
				}
			}
			br.close();
			System.out.println("| " + count + " synonyms");
		}
	}

	void dumpSynonyms(String filename) throws IOException {
		PrintStream out = Taxonomy.openw(filename);
		out.println("name\t|\tid\t|\tuniqname\t|\t");
		for (String name : this.synonyms.keySet())
			for (Node node : this.synonyms.get(name))
				out.println(name + "\t|\t" +
							node.id + "\t|\t" +
							name + " (synonym for " + node.name + ")" +
							"\t|\t");
		out.close();
	}

	/*
	   flags are:

	   nototu # these are non-taxonomic entities that will never be made available for mapping to input tree nodes. we retain them so we can inform users if a tip is matched to one of these names
	   unclassified # these are "dubious" taxa that will be made available for mapping but will not be included in synthesis unless they exist in a mapped source tree
	   incertaesedis # these are (supposed to be) recognized taxa whose position is uncertain. they are generally mapped to some ancestral taxon, with the implication that a more precise placement is not possible (yet). shown in the synthesis tree whether they are mapped to a source tree or not
	   hybrid # these are hybrids
	   viral # these are viruses

	   rules listed below, followed by keywords for that rule.
	   rules should be applied to any names matching any keywords for that rule.
	   flags are inherited (conservative approach), except for "incertaesedis", which is a taxonomically explicit case that we can confine to the exact relationship (hopefully).

	   # removed keywords
	   scgc # many of these are within unclassified groups, and will be treated accordingly. however there are some "scgc" taxa that are within recognized groups. e.g. http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Undef&id=939181&lvl=3&srchmode=2&keep=1&unlock . these should be left in. so i advocate removing this name and force-flagging all children of unclassified groups.

	   ==== rules

	   # rule 1: flag taxa and their descendents `nototu`
	   # note: many of these are children of the "other sequences" container, but if we treat the cases individually then we will also catch any instances that may occur elsewhere (for some bizarre reason).
	   # note: any taxa flagged `nototu` need not be otherwise flagged.
	   other sequences
	   metagenome
	   artificial
	   libraries
	   bogus duplicates
	   plasmids
	   insertion sequences
	   midvariant sequence
	   transposons
	   unknown
	   unidentified
	   unclassified sequences
	   * .sp # apply this rule to "* .sp" taxa as well

	   # rule 6: flag taxa and their descendents `hybrid`
	   x

	   # rule 7: flag taxa and their descendents `viral`
	   viral
	   viroids
	   Viruses
	   viruses
	   virus

	   # rule 3+5: if the taxon has descendents, 
	   #             flag descendents `unclassified` and elide,
	   #    		 else flag taxon `unclassified`.
	   # (elide = move children to their grandparent and mark as 'not_otu')
	   mycorrhizal samples
	   uncultured
	   unclassified
	   endophyte
	   endophytic

	   # rule 2: if the taxon has descendents, 
	   #             flag descendents `unclassified` and elide,
 	   # 			 else flag taxon 'not_otu'.
	   environmental

	   # rule 4: flag direct children `incertae_sedis` and elide taxon.
	   incertae sedis
	*/

	void analyze() {
		analyzeNodeNames(this.root);
		analyzeNodeRanks(this.root);
	}

	void analyzeNodeNames(Node node) {
		if (notOtuRegex.matcher(node.name).find()) // Rule 1
			flagRecursively(node, "not_otu");
		else if (hybridRegex.matcher(node.name).find()) // Rule 6
			flagRecursively(node, "hybrid");
		else if (viralRegex.matcher(node.name).find()) // Rule 7
			flagRecursively(node, "viral");
		else if (unclassifiedRegex.matcher(node.name).find()) {// Rule 35
			if (node.children != null) {
				flagRecursively(node, "unclassified1");
				elide(node);
			} else
				flag(node, "unclassified2");
		} else if (environmentalRegex.matcher(node.name).find()) {// Rule 2
			if (node.children != null) {
				flagRecursively(node, "unclassified3");
				elide(node);
			} else
				flag(node, "not_otu");
		} else if (node.children != null && incertaeRegex.matcher(node.name).find()) {// Rule 4
			for (Node child : new ArrayList<Node>(node.children))
				analyzeNodeNames(child);
			for (Node child : node.children)
				flag(child, "incertae_sedis");
			elide(node);
		}
	}

	void analyzeNodeRanks(Node node) {
		if (node.rank.equals("species")) {
			if (node.children != null)
				for (Node child : node.children)
					flagRecursively(child, "infraspecific"); // ~= not_otu
			node.barrenp = false;
		}
		else if (node.children != null) {
			for (Node child : node.children) {
				analyzeNodeRanks(child);
				if (!child.barrenp) node.barrenp = false;
			}
			if (node.barrenp)
				flag(node, "barren");

			// Check for unequal ranks among children
			// Figure out which rank is higher than the other...
			int highrank = Integer.MAX_VALUE;
			int highnorank = Integer.MAX_VALUE;
			boolean mixed = false;
			for (Node child : node.children) {
				int rv = ranks.get(child.rank);
				if (rv < highnorank) {
					if (highnorank < Integer.MAX_VALUE)
						mixed = true;
					highnorank = rv;
					// 0 = "no rank", acts as wildcard
					if (rv > 0)
						highrank = rv;
				}
			}
			// highrank is the highest (lowest-numbered) rank among all the non-"no rank" children
			// highnorank is the highest (lowest-numbered) rank among all the children
			if (mixed) {
				if (highrank == Integer.MAX_VALUE) highrank = highnorank; //shouldn't happen
				// Two cases: subfamily/genus, phylum/genus
				int x = uprank[highrank]; //subfamily->family, phylum->phylum
				for (Node child : node.children) {
					// remember "no rank" => 0
					int rv = ranks.get(child.rank);
					// we know rv >= highrank
					if (rv > highrank) {
						int y = downrank[rv]; //genus->genus, subfamily->genus
						// we know y > x
						if (y == x+1)
							// 168940 of these, about 20% from GBIF
							// e.g. Australopithecus
							flag(child, "unplaced"); //genus not in subfamily
						else
							// 66309 of these, about half from GBIF
							// e.g. Sirozythia
							flagRecursively(child, "unclassified4");
					} else
						// 311695 e.g. Homininae
						flag(child, "countme");
				}
			}
		}
	}

	// Splice the node out of the hierarchy, but leave it as a
	// residual terminal non-OTU node
	void elide(Node node) {
		if (node.children != null && node.parent != null)
			for (Node child : new ArrayList<Node>(node.children))
				child.changeParent(node.parent);
		flag(node, "not_otu");
		node.barrenp = true;
	}

	// Ensure that the flags get propagated to all descendents
	void flagRecursively(Node node, String flags) {
		flag(node, flags);
		if (node.children != null) {
			for (Node child : node.children)
				flagRecursively(child, flags);
		}
	}

	// Typically there will only be one flag
	void flag(Node node, String flags) {
		if (node.flags == null)
			node.flags = flags;
		else
			node.flags = node.flags + "," + flags;
	}
	
	static Pattern notOtuRegex =
		Pattern.compile(
						"\\bother sequences\\b|" +
						"\\bmetagenome\\b|" +
						"\\bartificial\\b|" +
						"\\blibraries\\b|" +
						"\\bbogus duplicates\\b|" +
						"\\bplasmids\\b|" +
						"\\binsertion sequences\\b|" +
						"\\bmidvariant sequence\\b|" +
						"\\btransposons\\b|" +
						"\\bunknown\\b|" +
						"\\bunidentified\\b|" +
						"\\bunclassified sequences\\b|" +
						"\\bsp\\.$"
						);

	static Pattern hybridRegex = Pattern.compile("\\bx\\b");

	static Pattern viralRegex =
		Pattern.compile(
						"\\bviral\\b|" +
						"\\bviroids\\b|" +
						"\\bViruses\\b|" +
						"\\bviruses\\b|" +
						"\\bvirus\\b"
						);

	static Pattern unclassifiedRegex =
		Pattern.compile(
						"\\bmycorrhizal samples\\b|" +
						"\\buncultured\\b|" +
						"\\bunclassified\\b|" +
						"\\bendophyte\\b|" +
						"\\bendophytic\\b"
						);

	static Pattern environmentalRegex = Pattern.compile("\\benvironmental\\b");

	static Pattern incertaeRegex = Pattern.compile("\\bincertae sedis\\b");

	static String[][] rankStrings = {
		{"no rank"},
		{"superkingdom",
		 "kingdom",
		 "subkingdom",
		 "superphylum"},
		{"phylum",
		 "subphylum",
		 "superclass"},
		{"class",
		 "subclass",
		 "infraclass",
		 "superorder"},
		{"order",
		 "suborder",
		 "infraorder",
		 "parvorder",
		 "superfamily"},
		{"family",
		 "subfamily",
		 "tribe",
		 "subtribe"},
		{"genus",
		 "subgenus",
		 "species group",
		 "species subgroup"},
		{"species",
		 "infraspecificname",
		 "subspecies",
		 "varietas",
		 "subvariety",
		 "forma",
		 "subform"},
	};

	static Map<String, Integer> ranks = new HashMap<String, Integer>();

	static int[] downrank, uprank;

	static void initRanks() {
		int k = 0;
		for (int i = 0; i < rankStrings.length; ++i) {
			for (int j = 0; j < rankStrings[i].length; ++j)
				ranks.put(rankStrings[i][j], k++);
		}
		downrank = new int[k];
		uprank = new int[k];

		k = 0;
		for (int i = 0; i < rankStrings.length; ++i) {
			for (int j = 0; j < rankStrings[i].length; ++j) {
				uprank[k] = i;
				downrank[k] = (j == 0 ? i : i+1);
				++k;
			}
		}
	}

	// -------------------- Newick stuff --------------------
	// Render this taxonomy as a Newick string.
	// This feature is very primitive and only for debugging purposes!

	String toNewick() {
		StringBuffer buf = new StringBuffer();
		if (this.root != null)
			this.root.appendNewickTo(buf); // class Node
		return buf.toString();
	}

	// Parse Newick yielding nodes

	Node newickToNode(String newick) {
		java.io.PushbackReader in = new java.io.PushbackReader(new java.io.StringReader(newick));
		try {
			return this.newickToNode(in);
		} catch (java.io.IOException e) {
			throw new RuntimeException(e);
		}
	}

	Node newickToNode(java.io.PushbackReader in) throws java.io.IOException {
		int c = in.read();
		if (c == '(') {
			List<Node> children = new ArrayList<Node>();
			{
				Node child;
				while ((child = newickToNode(in)) != null) {
					if (child != null) children.add(child);
					int d = in.read();
					if (d < 0 || d == ')') break;
					if (d != ',')
						System.out.println("shouldn't happen: " + d);
				}
			}
			Node node = newickToNode(in); // get postfix name, x in (a,b)x
			if (node != null || children.size() > 0) {
				if (node == null) node = new Node(this);
				for (Node child : children)
					node.addChild(child);
				return node;
			} else
				return null;
		} else {
			StringBuffer buf = new StringBuffer();
			while (true) {
				if (c < 0 || c == ')' || c == ',') {
					if (c >= 0) in.unread(c);
					if (buf.length() > 0) {
						Node node = new Node(this);
						node.setName(buf.toString());
						return node;
					} else return null;
				} else {
					buf.appendCodePoint(c);
					c = in.read();
				}
			}
		}
	}

	static PrintStream openw(String filename) throws IOException {
		PrintStream out;
		if (filename.equals("-")) {
			out = System.out;
			System.err.println("Writing to standard output");
		} else {
			out = new java.io.PrintStream(new java.io.BufferedOutputStream(new java.io.FileOutputStream(filename)));
			System.err.println("Writing " + filename);
		}
		return out;
	}

}

class SourceTaxonomy extends Taxonomy {

	// Used by idsource
	List<Answer> deprecated = new ArrayList<Answer>();

	SourceTaxonomy() {
	}

	void mapInto(UnionTaxonomy union, Criterion[] criteria) {

		// 0. Reset statistics counters, mapped, etc
		// 1. Map tips
		// 2. Map internal nodes
		// 3. Add previously unmapped tips and internal nodes

		union.sources.add(this);

		if (this.root != null) {

			Node.resetStats();
			System.out.println("--- Mapping " + this.getTag() + " into union ---");

			int beforeCount = union.nameIndex.size();

			// Ensure that union also has a root
			if (union.root == null)
				union.root = new Node(union); // Name gets set by unify
			else
				// Clear out gumminess from previous merges
				union.root.reset();

			// Generalize this later.
			this.root.unifyWith(union.root);

			this.pin(union);

			if (this.root.mapped == null)
				this.root.report("Root didn't map", union.root);

			// Prepare for subsumption checks
			union.root.assignBrackets();

			// Consider all matches where names coincide.
			// When matching P homs to Q homs, we get PQ choices of which
			// possibility to attempt first.
			// Treat each name separately.

			int incommon = 0;
			for (String name : this.nameIndex.keySet()) {
				List<Node> unodes = union.nameIndex.get(name);
				if (unodes != null) {
					++incommon;
					List<Node> nodes = this.lookup(name);
					Node uarb = unodes.get(0);
					new Matrix(nodes, unodes).run(criteria);
				}
			}
			for (String name : this.nameIndex.keySet()) {
				List<Node> unodes = union.synonyms.get(name);
				if (unodes != null) {
					++incommon;
					List<Node> nodes = this.lookup(name);
					Node uarb = unodes.get(0);
					for (Node node : nodes)
						union.logAndMark(Answer.noinfo(node, uarb, "synonym", node.name));
					new Matrix(nodes, unodes).run(criteria);
				}
			}
			System.out.println("| Names in common: " + incommon);

			Node.printStats();

			// Report on how well the merge went.
			this.mappingReport(union);
		}
	}

	// What was the fate of each of the nodes in this source taxonomy?

	void mappingReport(UnionTaxonomy union) {

		if (Node.windyp) {

			int total = 0;
			int nonamematch = 0;
			int prevented = 0;
			int added = 0;
			int corroborated = 0;

			// Could do a breakdown of matches and nonmatches by reason

			for (Node node : this) {
				++total;
				if (union.lookup(node.name) == null)
					++nonamematch;
				else if (node.mapped == null)
					++prevented;
				else if (node.mapped.origin() == node)
					++added;
				else
					++corroborated;
			}

			System.out.println("| Of " + total + " nodes in " + this.getTag() + ": " +
							   (total-nonamematch) + " with name in common, of which " + 
							   corroborated + " matched with existing, " + 
							   // added + " added, " +	  -- this hasn't happened yet
							   prevented + " blocked");
		}
	}

	// List determined manually and empirically
	void pin(UnionTaxonomy union) {
		String[][] pins = {
			// Stephen's list
			{"Fungi"},
			{"Bacteria"},
			{"Alveolata"},
			// {"Rhodophyta"},  creates duplicate of Cyanidiales
			{"Glaucocystophyceae"},
			{"Haptophyceae"},
			{"Choanoflagellida"},
			{"Metazoa", "Animalia"},
			{"Viridiplantae", "Plantae"},
			// JAR's list
			{"Mollusca"},
			// {"Eukaryota"},		// doesn't occur in gbif, but useful for ncbi/ncbi test merge
			// {"Archaea"},			// ambiguous in ncbi
		};
		int count = 0;
		for (int i = 0; i < pins.length; ++i) {
			String names[] = pins[i];
			Node n1 = null, n2 = null;
			// For each pinnable name, look for it in both taxonomies
			// under all possible synonyms
			for (int j = 0; j < names.length; ++j) {
				String name = names[j];
				Node m1 = this.highest(name);
				if (m1 != null) n1 = m1;
				Node m2 = union.highest(name);
				if (m2 != null) n2 = m2;
			}
			if (n1 != null && n2 != null) {
				n1.setDivision(names[0]);
				n2.setDivision(names[0]);
				n1.unifyWith(n2); // hmm.  TBD: move this out of here
				n2.addComment("is-division", n1);
				++count;
			}
		}
		if (count > 0)
			System.out.println("Pinned " + count + " out of " + pins.length);
	}

	void augment(UnionTaxonomy union, boolean retentivep) {
		if (this.root != null) {
			// Add heretofore unmapped consistent nodes, unless 'paraphyletic'
			if (Node.windyp)
				System.out.println("--- Augmenting union with new nodes from " + this.getTag() + " ---");
			int startcount = union.count();
			this.root.augment(union, retentivep);
			if (Node.windyp) {
				System.out.println("| Started with:		 " + startcount);
				Node.augmentationReport();
				System.out.println("| Ended with:		 " + union.count());
			}
			if (union.nameIndex.size() < 10)
				System.out.println(" -> " + union.toNewick());
		}
	}
	
	// Propogate synonyms from source taxonomy to union.
	// Some names that are synonyms in the source might be primary names in the union,
	//  and vice versa.
	void copySynonyms(UnionTaxonomy union) {
		for (String syn : this.synonyms.keySet()) {
			List<Node> fromnodes = this.synonyms.get(syn);  // possibly a syno-homonym
			List<Node> tonodes = union.nameIndex.get(syn);
			List<Node> sonodes = union.synonyms.get(syn);

			for (Node node : fromnodes)
				if (node.mapped != null) {
					if (tonodes != null && tonodes.contains(node.mapped)) {
						// 2124 merging GBIF into NCBI e.g. Avenella flexuosa
						// System.err.println("Case 1: " + syn);
						continue;
					}
					if (sonodes != null && sonodes.contains(node.mapped)) {
						// 144 cases *within NCBI* as of 2013-07-06
						// all were common names e.g. "diatoms"
						// 21307 cases merging GBIF into NCBI ! e.g. Muraena miliaris
						// System.err.println("Case 2: " + syn);
						continue;
					}
					if (sonodes == null) { // The normal case
						sonodes = new ArrayList<Node>(1);
						union.synonyms.put(syn, sonodes);
					}
					sonodes.add(node.mapped);
				}
		}
		for (String name : this.nameIndex.keySet()) {
			List<Node> fromnodes = this.nameIndex.get(name);  // possibly a syno-homonym
			List<Node> tonodes = union.nameIndex.get(name);
			List<Node> sonodes = union.synonyms.get(name);

			for (Node node : fromnodes)
				if (node.mapped != null) {
					if (tonodes != null && tonodes.contains(node.mapped))
						continue; // The normal case
					if (sonodes != null && sonodes.contains(node.mapped))
						continue; // pretty frequent, 7131 GBIF/NCBI cases as of 2013-07-06
					if (sonodes == null) {
						sonodes = new ArrayList<Node>(1);
						union.synonyms.put(name, sonodes);
						// Plantae
						System.err.println("Case 4: " + name);
					}
					sonodes.add(node.mapped);
				}
		}
			

	}

	static SourceTaxonomy readTaxonomy(String filename) throws IOException {
		SourceTaxonomy tax = new SourceTaxonomy();
		tax.root = tax.loadTaxonomy(filename);
		return tax;
	}

	static SourceTaxonomy parseNewick(String newick) {
		SourceTaxonomy tax = new SourceTaxonomy();
		tax.root = tax.newickToNode(newick);
		return tax;
	}
}

class UnionTaxonomy extends Taxonomy {

	List<SourceTaxonomy> sources = new ArrayList<SourceTaxonomy>();
	SourceTaxonomy idsource = null;
	SourceTaxonomy auxsource = null;
	Map<String, List<Answer>> logs = new HashMap<String, List<Answer>>();

	UnionTaxonomy() {
		this.tag = "union";
	}

	void mergeIn(SourceTaxonomy source) {
		source.which = this.sources.size();
		source.mapInto(this, Criterion.criteria);
		source.originp = true;
		source.augment(this, true);
		source.copySynonyms(this);
	}

	// Assign ids, harvested from idsource and new ones as needed, to nodes in union.

	void assignIds(SourceTaxonomy idsource) {
		this.idsource = idsource;
		idsource.which = this.sources.size();
		idsource.mapInto(this, Criterion.idCriteria);

		Node.resetStats();
		System.out.println("--- Assigning ids to union starting with " + idsource.getTag() + " ---");
		long maxid = idsource.maxid;
		System.out.println("| Highest id before: " + maxid);

		// Phase 1: recycle previously assigned ids.
		for (Node node : idsource) { // node is in the idsource
			Node unode = node.mapped;
			Answer answer;
			if (unode != null) {
				answer = assessSource(node, unode);
				if (answer.value >= Answer.DUNNO)
					Node.markEvent("keeping-id");
				else
					this.logAndMark(answer);
				unode.setId(node.id);	//if (unode.id == Node.NO_ID) ;
				continue;
			}
			else if (node.deprecationReason != null) {
				answer = node.deprecationReason;
				Node.markEvent(answer.reason); // will already be in the log
			} else {
				if (this.lookup(node.name) != null) 
					answer = Answer.no(node, null, "deprecated", "blocked");
				else			// mooted?
					answer = Answer.no(node, null, "deprecated", "not-mapped");
				this.logAndMark(answer);
			}
			idsource.deprecated.add(answer);
		}

		// Phase 2: give new ids to union nodes that didn't get them above.
		for (Node node : this)	 // this = union, idsource = ottol
			if (node.id < 0) {
				node.setId(++maxid);
				node.addComment("new");
				node.markEvent("new-id");
			}

		Node.printStats();		// Taxon id clash

		System.out.println("| Highest id after: " + maxid);
		
		if (this.maxid < idsource.maxid)
			System.out.println(" *** NYI: the highest id is deprecated: " +
							   this.maxid + " < " + idsource.maxid);
	}

	// x is a source node drawn from idsource

	static Answer assessSource(Node x, Node y) {
		if (x.extra != null && x.extra.length > 5) {
			NodeRef ref = x.putativeSourceRef();
			if (ref != null) {
				String putativeSourceTag = ref.tag;
				long putativeId = ref.id;

				// Find source node in putative source taxonomy, if any
				Node sourceThere = null;
				for (Node source : y.sourcenodes)
					if (source.taxonomy.getTag().equals(putativeSourceTag)) {
						sourceThere = source;
						break;
					}

				if (sourceThere == null)
					return Answer.no(x, y, "note/different-source",
									 ref
									 + "->" +
									 y.origin().getQualifiedId());
				if (putativeId != (long)sourceThere.id)
					return Answer.no(x, y, "note/different-source-id",
									 ref
									 + "->" +
									 sourceThere.getQualifiedId());
				else
					return Answer.NOINFO;
			} else
				return Answer.NOINFO;
		} else
			return Answer.NOINFO;
	}

	void dumpDeprecated(SourceTaxonomy idsource, String filename) throws IOException {
		PrintStream out = Taxonomy.openw(filename);
		out.println("id\tname\treason\tsourceinfo");
		for (Answer answer : idsource.deprecated)
			out.println(answer.x.id
						+ "\t" +
						answer.x.name
						+ "\t" +
						(answer.witness != null ? answer.witness : answer.reason)
						+ "\t" +
						answer.x.getSourceIds()
						);
		out.close();
	}

	void loadAuxIds(SourceTaxonomy aux, SourceTaxonomy idsource) {
		this.auxsource = aux;
		aux.mapInto(this, Criterion.idCriteria);
	}

	void explainAuxIds(SourceTaxonomy aux, SourceTaxonomy idsource, String filename)
		throws IOException
	{
		System.out.println("--- Comparing new auxiliary id mappings with old ones ---");
		Node.resetStats();		// Taxon id clash
		PrintStream out = Taxonomy.openw(filename);
		Set<Long> seen = new HashSet<Long>();
		Integer col = idsource.headerx.get("preottol_id"); // 8
		if (col != null) {
			for (Node idnode : idsource) 
				if (idnode.mapped != null && idnode.extra != null && idnode.extra.length > col) {
					String idstringfield = idnode.extra[col];
					if (idstringfield.length() == 0) continue;
					for (String idstring : idstringfield.split(",")) {
						Long auxId = new Long(idstring);
						Node auxnode = aux.idIndex.get(auxId);
						String reason;
						if (auxnode == null)
							reason = "not-found-in-aux-source";
						else if (auxnode.mapped == null)
							reason = "not-resolved-to-union";  //, auxnode, idstring
						else if (idnode.mapped == null)
							reason = "not-mapped";
						else if (auxnode.mapped != idnode.mapped)
							reason = "mapped-differently";	 // , auxnode.mapped, idstring
						else
							reason = "ok";	 // "Aux id in idsource mapped to union" // 107,576
						out.print(idstring
								  + "\t" +
								  ((auxnode == null || auxnode.mapped == null) ? "" : auxnode.mapped.id)
								  + "\t" +
								  reason + "\n");
						Node.markEvent("reason");
						seen.add(auxId);
					}
				}
		} else
			System.out.println("| N.b. no 'preottol_id' column in aux source file");

		for (Node auxnode : aux) {
			if (auxnode.mapped != null && !seen.contains(auxnode.id))
				out.print("" + auxnode.id
						  + "\t" +
						  auxnode.mapped.id
						  + "\t" +
						  "new" + "\n");
			Node.markEvent("new-aux-mapping");
		}
		Node.printStats();
		out.close();
	}

	void finish() {
		// Flag homonyms
		for (Node node: this) {	  // this = union
			List<Node> nodes = this.lookup(node.name);
			if (nodes != null && nodes.size() > 1)
				node.addComment("homonym"); // Do this only once, at the end
		}
	}

	static Pattern tabPattern = Pattern.compile("\t");

	// Apply a set of edits to the union taxonomy

	void edit(String dirname) throws IOException {
		File[] editfiles = new File(dirname).listFiles();
		for (File editfile : editfiles) {
			if (!editfile.getName().endsWith("~")) {
				System.out.println("--- Applying edits from " + editfile + " ---");
				FileReader fr = new FileReader(editfile);
				BufferedReader br = new BufferedReader(fr);
				String str;
				while ((str = br.readLine()) != null) {
					if (!(str.length()==0) && !str.startsWith("#")) {
						String[] row = tabPattern.split(str);
						if (row.length > 0 &&
							!row[0].equals("command")) { // header row!
							if (row.length != 6)
								System.err.println("Ill-formed command: " + str);
							else
								applyOneEdit(row);
						}
					}
				}
				fr.close();
			}
		}
	}

	// E.g. add	Acanthotrema frischii	species	Acanthotrema	Fungi	IF:516851

	void applyOneEdit(String[] row) {
		String command = row[0];
		String name = row[1];
		String rank = row[2];
		String parentName = row[3];
		String contextName = row[4];
		String sourceInfo = row[5];

		List<Node> parentCandidates = this.lookup(parentName);
		if (parentCandidates == null) {
			System.err.println("(add) Parent not found: " + parentName);
			return;
		}

		parentCandidates = filterByContext(parentCandidates, contextName);
		if (parentCandidates == null) {
			System.err.println("(add) Parent not found in context: " + parentName
							   + " in " + contextName);
			return;
		}
		if (parentCandidates.size() > 1) {
			System.err.println("(add) Parent name is ambiguous: " + parentName);
			return;
		}
		Node parent = parentCandidates.get(0);

		if (!parent.name.equals(parentName))
			System.err.println("(add) Warning: parent taxon name is a synonym: " + parentName);

		List<Node> existing = this.lookup(name);
		if (existing != null)
			existing = filterByContext(existing, contextName);

		if (command.equals("add")) {
			if (existing != null) {
				System.err.println("(add) Warning: taxon already present: " + name);
				boolean winp = false;
				Node oldparent = null;
				for (Node node : existing)
					if (node.parent == parent) winp = true;
					else oldparent = node.parent;
				if (!winp)
					System.err.println("(add)  ... with a different parent: " + oldparent.name);
			} else {
				Node node = new Node(this);
				node.setName(name);
				node.rank = rank;
				node.sourceInfo = sourceInfo;
				parent.addChild(node);
			}
		} else if (command.equals("move")) {
			if (existing == null)
				System.err.println("(move) No taxon to move: " + name);
			else if (existing.size() > 1)
				System.err.println("(move) Ambiguous taxon name: " + name);
			else {
				Node node = existing.get(0);
				if (node.parent == parent)
					System.err.println("(move) Warning: already in the right place: " + name);
				else
					node.changeParent(parent);
			}
		} else if (command.equals("synonym")) {
			// TBD: error checking
			List<Node> nodes = this.synonyms.get(name);
			if (nodes == null) {
				nodes = new ArrayList<Node>(1);
				this.synonyms.put(name, nodes);
			}
			nodes.add(parent);
		} else
			System.err.println("Unrecognized edit command: " + command);
	}

	List<Node> filterByContext(List<Node> nodes, String contextName) {
		List<Node> fnodes = new ArrayList<Node>(1);
		for (Node node : nodes)
			// Follow ancestor chain to see whether this node is in the context
			for (Node chain = node; chain != null; chain = chain.parent)
				if (chain.name.equals(contextName)) {
					fnodes.add(node);
					break;
				}
		return fnodes.size() == 0 ? null : fnodes;
	}

	// outprefix should end with a / , but I guess . would work too

	void dumpAll(String outprefix) throws IOException {
		this.analyze();
		this.dumpLog(outprefix + "log");
		this.dump(this.root, outprefix + "taxonomy");
		this.dumpSynonyms(outprefix + "synonyms");
		if (this.idsource != null)
			this.dumpDeprecated(this.idsource, outprefix + "deprecated");
		if (this.auxsource != null)
			this.explainAuxIds(this.auxsource,
							   this.idsource,
							   outprefix + "aux");
	}

	void dump(Node unode, String filename) throws IOException {
		PrintStream out = Taxonomy.openw(filename);

		out.println("uid\t|\tparent_uid\t|\tname\t|\trank\t|\tsourceinfo\t|\tuniqname\t|\tflags\t|\t"
					// 0	 1				2		 3		  4				 5             6
					);

		dumpNode(unode, true, out);
		out.close();
	}

	// Recursive!
	void dumpNode(Node unode, boolean rootp, PrintStream out) {
		// 0. uid:
		out.print(unode.id + "\t|\t");
		// 1. parent_uid:
		out.print((rootp ? "" : unode.parent.id)  + "\t|\t");
		// 2. name:
		out.print((rootp ? "life" :
				   (unode.name == null ? "?" : unode.name)) + "\t|\t");
		// 3. rank:
		out.print((unode.rank == null ? "" : unode.rank) + "\t|\t");

		// 4. source information
		out.print(unode.getSourceIds() + "\t|\t");

		// 5. uniqname
		out.print(uniqueName(unode) + "\t|\t");

		// 6. flags
		// (unode.mode == null ? "" : unode.mode)
		out.print(((unode.flags != null) ? unode.flags : "") + "\t|\t");

		out.println();

		if (unode.children != null)
			for (Node child : unode.children)
				dumpNode(child, false, out);
	}

	static String uniqueName(Node unode) {
		List<Node> nodes = unode.taxonomy.lookup(unode.name);
		if (nodes == null) return "";

		boolean difficultp = false;
		if (unode.name.indexOf(" sp.") >= 0)
			difficultp = true;

		if (!difficultp && nodes.size() < 2) return "";

		// Homonym
		Node i = unode.informative();

		if (i != null && !difficultp)
			for (Node other : nodes)
				if (other != unode) {
					Node j = other.informative();
					if (i == j) {
						difficultp = true;
						break;
					}
				}
		if (i != null && !difficultp) {
			String urank = "";
			if (!unode.rank.equals("no rank")) urank = unode.rank + " ";
			String irank = "";
			if (!i.rank.equals("no rank")) irank = i.rank + " ";
			return unode.name + " (" + urank + "in " + irank + i.name + ")";
		} else {
			Node origin = unode.origin();
			if (origin != null)
				return unode.name + " (" + unode.getSourceIds() + ")";
			else
				// this case should never arise... the following is a total copout
				return unode.name + "(ot:" + unode.id + ")";
		}
	}

	// called on union

	void dumpLog(String filename) throws IOException {
		PrintStream out = Taxonomy.openw(filename);

		// Strongylidae	nem:3600	yes	same-parent/direct	3600	Strongyloidea	false

		out.println("name\t" +
					"source_qualified_id\t" +
					"parity\t" +
					"reason\t" +
					"union_uid\t" +
					"witness");

		Set<String> seen = new HashSet<String>();
		for (Node node : this)	// preorder
			if (!seen.contains(node.name)) {
				List<Answer> answers = this.logs.get(node.name);
				if (answers == null) continue; //shouldn't happen
				boolean interestingp = false;
				for (Answer answer : answers)
					if (answer.isInteresting()) {interestingp = true; break;}
				if (interestingp)
					for (Answer answer : answers)
						out.println(answer.dump());
				seen.add(node.name);
			}
		// might be missing some log entries for synonyms

		out.close();
	}

	// this is a union taxonomy ...

	void log(Answer answer) {
		String name = null;
		if (answer.y != null) name = answer.y.name;
		if (name == null && answer.x != null) name = answer.x.name;	 //could be synonym
		if (name == null) return;					 // Hmmph.
		List<Answer> lg = this.logs.get(name);
		if (lg == null) {
			lg = new ArrayList<Answer>(1);
			this.logs.put(name, lg);
		}
		lg.add(answer);
	}
	void logAndMark(Answer answer) {
		this.log(answer);
		Node.markEvent(answer.reason);
	}
	void logAndReport(Answer answer) {
		this.log(answer);
		answer.x.report(answer.reason, answer.y, answer.witness);
	}

}

// or, Taxon

class Node {
	Long id;
	Node parent = null;
	String name, rank = null;
	List<Node> children = null;
	Taxonomy taxonomy;			// For subsumption checks etc.
	String[] extra = null;		// Source, source id, other ottol fields
	String sourceInfo = null;   // Cf. editing feature
	int size = -1;
	List<Node> sourcenodes = null;
	Answer deprecationReason = null;
	Answer blockedp = null;

	String flags = null;
	boolean barrenp = true;

	// State during merge operation
	Node mapped = null;			// source node -> union node
	Node comapped = null;		// union node -> source node
	boolean novelp = true;
	private String division = null;

	static boolean windyp = true;

	Node(Taxonomy tax) {
		this.taxonomy = tax;
		this.id = tax.fakeIdCounter--;
	}

	// Clear out temporary stuff from union nodes
	void reset() {
		this.mapped = null;
		this.comapped = null;
		this.division = null;
		this.novelp = false;
		resetBrackets();
		if (children != null)
			for (Node child : children)
				child.reset();
	}


	// parts = fields from row of dump file
	// uid	|	parent_uid	|	name	|	rank	|	source	|	sourceid
	//		|	sourcepid	|	uniqname	|	preottol_id	|	
	void init(String[] parts) {
		this.setName(parts[2]);
		if (parts.length >= 4)
			this.rank = parts[3];
		if (parts.length >= 5)
			this.extra = parts;
	}

	void setName(String name) {
		if (this.name != null)
			System.err.println("Already named: " + name + " -> " + this.name);
		this.name = name;
		this.taxonomy.addToIndex(this);
	}

	void setId(long id) {
		if (id < 0)				// == Node.NO_ID
			this.report("Shouldn't happen: setting negative node id");
		this.id = id;
		if (id > this.taxonomy.maxid)
			this.taxonomy.maxid = id;
		this.taxonomy.idIndex.put(new Long(id), this);
	}

	Node getParent() {
		return parent;
	}

	void addChild(Node child) {
		if (child.taxonomy != this.taxonomy) {
			this.report("Attempt to add child in different taxonomy", child);
			Node.backtrace();
		} else if (child.parent != null) {
			if (this.report("Attempt to steal child !!??", child))
				Node.backtrace();
		} else {
			child.parent = this;
			if (this.children == null)
				this.children = new ArrayList<Node>();
			this.children.add(child);
		}
	}

	static void backtrace() {
		try {
			throw new Exception("Backtrace");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	void changeParent(Node newparent) {
		Node p = this.parent;
		this.parent = null;
		p.children.remove(this);
		if (p.children.size() == 0)
			p.children = null;
		newparent.addChild(this);
	}

	// Go upwards and cache on the way back down
	String getDivision() {
		if (this.division == null) {
			if (this.parent == null)
				this.division = null;
			else
				this.division = this.parent.getDivision();
		}
		return this.division;
	}

	void setDivision(String division) {
		if (this.division != null)
			this.report("!? changing divisions doesn't work");
		this.division = division;
	}

	// Nearest ancestor having a name that's not a prefix of ours... and isn't also a homonym
	Node informative() {
		Node up = this.parent;
		while (up != null &&
			   (this.name.startsWith(up.name) || up.taxonomy.lookup(up.name).size() > 1))
			up = up.parent;
		return up;
	}

	//out.println("uid\t|\tparent_uid\t|\tname\t|\trank\t|\t" +
	//			"source\t|\tsourceid\t|\tsourcepid\t|\tuniqname\t|\tpreottol_id\t|\t");

	NodeRef putativeSourceRef() {
		if (this.taxonomy.sourcecolumn >= 0) {
			return new NodeRef(this.extra[this.taxonomy.sourcecolumn],
							   Long.parseLong(this.extra[this.taxonomy.sourceidcolumn]));
		}
		if (this.taxonomy.infocolumn >= 0) {
			String sourceqids = this.extra[this.taxonomy.infocolumn];
			int pos = sourceqids.indexOf(',');
			if (pos > 0)
				return new NodeRef(sourceqids.substring(0, pos));
			else
				return new NodeRef(sourceqids);
			// for (String sourceqid : sourceqids.split(","))  ...
		}
		return null;
	}

	// If this is a node from the union taxonomy, return the
	// corresponding original source node (the one that contributed it)
	Node origin() {
		if (this.sourcenodes != null)
			for (Node node: this.sourcenodes)
				if (node != null) return node;
		return null;
	}

	// unode is a node in the union taxonomy, possibly fresh

	void unifyWith(Node unode) {
		if (this.mapped == unode) return; // redundant
		if (this.mapped != null) {
			// Shouldn't happen - assigning single source taxon to two
			//	different union taxa
			if (this.report("Already assigned to node in union:", unode))
				Node.backtrace();
			return;
		}
		if (unode.comapped != null) {
			// Union node has already been matched to, but synonyms are OK
			this.report("Union node already mapped tog, creating synonym", unode);
		}
		this.mapped = unode;

		if (unode.name == null) unode.setName(this.name);
		if (unode.rank == null) unode.rank = this.rank; // ?
		unode.comapped = this;

		if (this.comment != null) { // cf. deprecate()
			unode.addComment(this.comment);
			this.comment = null;
		}

		if (unode.sourcenodes == null)
			unode.sourcenodes = new ArrayList<Node>(3);
		unode.sourcenodes.add(this);
	}

	// Recursive descent over source taxonomy

	static void augmentationReport() {
		if (Node.windyp)
			Node.printStats();
	}

	// Add most of the otherwise unmapped nodes to the union taxonomy,
	// either as new names, fragmented taxa, or (occasionally)
	// new homonyms, or vertical insertions.

	// This node is already mapped, but it may get new children.

	String comment = null;	   // the reason(s) that it is what it is (or isn't)

	void addComment(String comment) {
		if (this.mapped != null)
			this.mapped.addComment(comment);
		if (this.comment == null)
			this.comment = comment;
		else if (this.comment != null)
			this.comment = this.comment + " " + comment;
	}

	// Best if node is *not* from the union... the ids don't display well

	void addComment(String comment, Node node) {
		this.addComment(comment + "(" + node.getQualifiedId() + ")");
	}

	void addComment(String comment, String name) {
		if (name == null)		// witness
			this.addComment(comment);
		else
			this.addComment(comment + "(" + name + ")");
	}

	Node augment(UnionTaxonomy union, boolean retentivep) {

		Node newnode = null;
		String reason = null;

		if (this.children == null) {
			if (this.mapped != null) {
				Node.markEvent("mapped/tip");
				return this.mapped;
			} else if (this.deprecationReason != null &&
					   // Create homonym iff it's an unquestionably bad match
					   this.deprecationReason.value > Answer.HECK_NO) {
				union.logAndMark(Answer.no(this, null, "blocked/tip", null));
				return null;
			} else {
				reason = "new/tip";
				if (!retentivep) return null;
				newnode = new Node(union);
				// fall through
			}
		} else {

			// The children fall into three classes
			//	A. Those that map to the "right" place (e.g. 'winner')
			//	B. Those that map to the "wrong" place (e.g. 'loser')
			//	C. Those that don't map - new additions to the union tree
			// oldChildren includes both A and B
			// newChildren = C
			// The affinities of those in C might be divided between A and B...
			// thus if B is nonempty (there is a 'loser') class C is called
			// 'ambiguous'

			List<Node> oldChildren = new ArrayList<Node>();
			List<Node> newChildren = new ArrayList<Node>();
			// Recursion step
			for (Node child: this.children) {
				Node augChild = child.augment(union, retentivep);
				if (augChild != null)
					if (augChild.parent == null)
						newChildren.add(augChild);
					else
						oldChildren.add(augChild);
			}

			if (newChildren.size() == 0) {
				if (this.mapped != null) {
					Node.markEvent("mapped/internal");
					return this.mapped;
				}

				if (this.deprecationReason != null &&
					this.deprecationReason.value > Answer.HECK_NO) {
					union.logAndMark(Answer.no(this, null, "blocked/internal", null));
					return null;
				}

				// Check for possible insertion event
				boolean sibs = true;
				Node mappedParent = null;
				for (Node child : this.children)
					if (mappedParent == null && child.mapped != null)
						mappedParent = child.mapped.parent;
					else if (child.mapped != null && mappedParent != child.mapped.parent)
						sibs = false;

				if (false &&	// See https://github.com/OpenTreeOfLife/opentree/issues/73
					sibs &&
					mappedParent != null &&
					oldChildren.size() < mappedParent.children.size() &&
					!(union.lookup(this.name) != null)) { // eschew homonyms

					// Insertion.
					// All children are old,  and siblings of one another.
					if (!retentivep) return null;

					newnode = new Node(union);
					mappedParent.addChild(newnode);
					for (Node child : oldChildren)
						// Steal it away!
						child.changeParent(newnode);
					this.unifyWith(newnode); // sets name.	might create a homonym, worry
					union.logAndMark(Answer.yes(this, newnode, "insertion", null));
					newnode.addComment("insertion", this);
					return newnode;
				} else {
					// Children all got sent away to other taxa.
					// The old union id (if any) will become deprecated.
					Answer a = Answer.no(this, null, "mooted", null);
					//this.deprecationReason = a;	not useful, it's not in idsource
					union.logAndMark(a);
					return null;
				}
			}

			// At least one new child...

			if (this.mapped != null) {
				for (Node augChild : newChildren)
					// *** This is where the Protozoa/Chromista trouble arises. ***
					// *** They are imported, then set as children of 'life'. ***
					this.mapped.addChild(augChild);

				// Classify & report on what has just happened
				// TBD: Maybe decorate the newChildren with info about the match?...
				Node loser = this.antiwitness(this.mapped);
				Node winner = this.witness(this.mapped);
				if (winner != null) {
					// Evidence of sameness [maybe parent agreement, or not]
					if (loser == null)
						// No evidence of differentness
						// cf. "is-subsumed-by" - compatible extension
						// (35,351)
						union.logAndMark(Answer.heckYes(this, newnode, "mapped/coherent", null));
					else {
						// Evidence of differentness
						// cf. "overlaps" ("type 1")
						// (1,482)
						union.logAndMark(Answer.yes(this, newnode, "mapped/incoherent", winner.name));
						//if (newnode != null)   // This seems wrong somehow
						//	newnode.mode = "incoherent"; // or "paraphyletic" ?
					}
				} else {
					// No evidence of sameness [except possible parent agreement]
					if (loser == null)
						// No evidence of differentness
						// cf. "by-elimination" - could actually be a homonym
						// (7,093 occurrences, as of 2013-04-24, of which 571 'essential')
						// (all but 94 of which have shared parents...)
						union.logAndMark(Answer.noinfo(this, newnode, "mapped/neutral", null));
					else
						// Evidence of differentness
						// This case is rare, because it's ruled out in
						// Criterion.subsumption, cf. "incompatible-with" ("type 2")
						// (52 times, as of 2013-04-24, + 13 unmapped)
						// Still arises when agreement on parent
						union.logAndMark(Answer.no(this, newnode, "mapped/incompatible", null));
				}

				return this.mapped;
			}
			{
				// Some of these are new non-homonyms,
				// some are new "true" homonyms,
				// some are new "false" homonyms.  Don't know how to
				// distinguish the latter two cases.

				// Assert (newChildren.size() == children.size())
				if (!retentivep) return null;
				// All children are new, not previously matched.
				// Compatible import of a subtree (new higher taxon).
				// Might create a homonym, but if so, it should.
				newnode = new Node(union);
				for (Node augChild: newChildren)
					newnode.addChild(augChild);
				reason = "new/internal";
				// should match old if possible ??
				// fall through
			}
		}

		// Fall through iff we created a new node (tip or internal).

		if (reason != null)
			union.logAndMark(Answer.heckYes(this, newnode, reason, null));

		// Either this is a name not before occurring in the union,
		//	 or the corresponding node(s) in union has been rejected
		//	 as a match.
		// Do this check before the unifyWith call, for prettier diagnostics.
		List<Node> losers = union.lookup(this.name);
		if (losers != null && losers.size() >= 1) {
			Node loser = losers.get(0);
			if (this.getDivision() == loser.getDivision()) {   //double check
				union.logAndMark(Answer.no(this, loser, "new-homonym/in-division", null));
			} else {
				union.logAndMark(Answer.no(this, loser, "new-homonym/out-division", null));
			} 
		}

		this.unifyWith(newnode);	   // sets name

		return newnode;						 // = this.mapped
	}

	// Mainly for debugging

	public String toString() {
		return this.toString(null);
	}

	String toString(Node other) {
		String twinkie = "";
		if (this.mapped != null || this.comapped != null)
			twinkie = "*";
		else if (other != null &&
				 other.taxonomy != this.taxonomy &&
				 other.taxonomy.lookup(this.name) != null)
			twinkie = "+";		// Name in common

		String ids;
		NodeRef ref = this.putativeSourceRef();
		if (ref != null)		// this is from idsource
			ids = this.id + "=" + ref;
		else {
			ids = this.getSourceIds();
			if (ids == null)
				ids = this.getQualifiedId();
			else				// this is from union
				ids = "{" + ids + "}";
		}

		return 
			"(" + ids +
			(this.children == null ? "." : "") +
			" " + this.name +
			twinkie +				// tbd: indicate division top with "#" 
			(this.comment != null ? (" " + this.comment) : "") +
			")";
	}

	// Returns a string of the form prefix:id,prefix:id,...
	// Generally called on a union taxonomy node

	String getSourceIds() {
		String ids = null;
		if (this.sourcenodes != null) {	// union (updated ottol)
			for (Node source : this.sourcenodes)
				if (source != null && source.taxonomy.originp) {
					String id = source.getQualifiedId();
					if (ids == null)
						ids = id;
					else
						ids = ids + "," + id;
				}
			return ids;
		} else if (this.taxonomy.sourcecolumn >= 0) {
			return (this.extra[this.taxonomy.sourcecolumn] + ":" +
					this.extra[this.taxonomy.sourceidcolumn]);
		} else if (this.taxonomy.infocolumn >= 0)
			return this.extra[this.taxonomy.infocolumn];
		else if (this.sourceInfo != null)
			return this.sourceInfo;
		else
			// callers expect non-null
			return "";
	}

	String getQualifiedId() {
		return this.taxonomy.getTag() + ":" + this.id;
	}

	// Event monitoring

	static Map<String, Long> eventStats = new HashMap<String, Long>();
	static List<String> eventStatNames = new ArrayList<String>();

	static boolean startReport(String note) {
		Long probe = eventStats.get(note);
		long count;
		if (probe == null) {
			eventStatNames.add(note);
			count = 0;
		} else
			count = probe;
		eventStats.put(note, count+(long)1);
		if (count <= 10) {
			return true;
		} else
			return false;
	}

	static void printStats() {
		for (String note : eventStatNames) { // In order added
			System.out.println("| " + note + ": " + eventStats.get(note));
		}
		// Reset...
		Node.resetStats();
	}

	static void resetStats() {
		eventStats = new HashMap<String, Long>();
		eventStatNames = new ArrayList();
	}

	// convenience variants

	static boolean markEvent(String note) {
		return startReport(note);
	}

	boolean report(String note, Node othernode) {
		return this.report(note, othernode, null);
	}

	boolean report(String note, Node othernode, String witness) {
		if (startReport(note)) {
			System.out.println("| " + note);
			this.report1("", othernode);
			if (othernode != null)
				othernode.report1("", this);
			if (witness != null)
				System.out.println("| " + witness);
			System.out.println();
			return true;
		}
		return false;
	}

	boolean report(String note, List<Node> others) {
		if (startReport(note)) {
			System.out.println("| " + note);
			this.report1("", null);
			for (Node othernode : others)
				othernode.report1("", others.get(0));
			System.out.println();
			return true;
		}
		return false;
	}

	void report(String tag) {
		if (startReport(tag))
			report1(tag, null);
	}

	void report1(String tag, Node other) {
		String output = "";
		int i = 0;
		boolean seenmapped = false;
		for (Node n = this; n != null; n = n.parent) {
			if (++i < 4 || (!seenmapped && (n.mapped != null || n.comapped != null))) {
				if (n.mapped != null || n.comapped != null)
					seenmapped = true;
				output += " " + n.toString(other);
			}
			else if (i == 4)
				output += " ...";
		}
		System.out.println(" " + tag + " " + output);
	}

	// N.b. this is in source taxonomy, match is in union
	boolean separationReport(String note, Node match) {
		if (startReport(note)) {
			System.out.println(note);

			Node nearestMapped = this;			 // in source taxonomy
			Node nearestMappedMapped = this;	 // in union taxonomy

			if (this.taxonomy != match.taxonomy) {
				if (!(this.taxonomy instanceof SourceTaxonomy) ||
					!(match.taxonomy instanceof UnionTaxonomy)) {
					this.report("Type dysfunction", match);
					return true;
				}
				// Need to cross from source taxonomy over into the union one
				while (nearestMapped != null && nearestMapped.mapped == null)
					nearestMapped = nearestMapped.parent;
				if (nearestMapped == null) {
					this.report("No matches, can't compute mrca", match);
					return true;
				}
				nearestMappedMapped = nearestMapped.mapped;
				if (nearestMappedMapped.taxonomy != match.taxonomy) {
					this.report("Not in matched taxonomies", match);
					return true;
				}
			}

			Node mrca = match.mrca(nearestMappedMapped); // in union tree
			if (mrca == null) {
				this.report("In unconnected trees !?", match);
				return true;
			}

			// Number of steps in source tree before crossing over
			int d0 = this.measureDepth() - nearestMapped.measureDepth();

			// Steps from source node up to mrca
			int d1 = d0 + (nearestMappedMapped.measureDepth() - mrca.measureDepth());
			int d2 = match.measureDepth() - mrca.measureDepth();
			int d3 = (d2 > d1 ? d2 : d1);
			String spaces = "															 ";
			Node n1 = this;
			for (int i = d3 - d1; i <= d3; ++i) {
				if (n1 == nearestMapped)
					n1 = nearestMappedMapped;
				System.out.println("  " + spaces.substring(0, i) + n1.toString(match));
				n1 = n1.parent;
			}
			Node n2 = match;
			for (int i = d3 - d2; i <= d3; ++i) {
				System.out.println("  " + spaces.substring(0, i) + n2.toString(this));
				n2 = n2.parent;
			}
			if (n1 != n2)
				System.err.println("Bug: " + n1 + " != " + n2);
			return true;
		}
		return false;
	}

	String elaboratedString(Taxonomy tax) {
		if (this.mapped != null)
			return this.toString();
		else {
			boolean h = (tax.unique(this.name) != null);
			return this.toString() +  (h ? "?" : "");
		}
	}

	// Number of child-less nodes at and below this node.

	int size() {
		if (size < 1) {
			size = 1;
			if (children != null)
				for (Node child: children)
					size += child.size();
		}
		return size;
	}

	// Brute force count of nodes (more reliable than size() in presence of change)
	int count() {
		int count = 1;
		if (this.children != null)
			for (Node child : this.children)
				count += child.count();
		return count;
	}

	static final int NOT_SET = -7; // for source nodes

	int seq = NOT_SET;		// Self
	int start = NOT_SET;	// First taxon included not including self
	int end = NOT_SET;		// Next taxon *not* included

	void resetBrackets() {			  // for union nodes
		this.seq = NOT_SET;			  // Self
		this.start = NOT_SET;	// First taxon included not including self
		this.end = NOT_SET;					   // Next taxon *not* included
	}

	// Applied to a union node
	void assignBrackets() {
		// Only consider names in common ???
		this.seq = this.taxonomy.nextSequenceNumber++;
		this.start = this.taxonomy.nextSequenceNumber;
		if (this.children != null)
			for (Node child : this.children)
				child.assignBrackets();
		this.end = this.taxonomy.nextSequenceNumber;
	}

	// Applied to a source node
	void getBracket(Taxonomy union) {
		if (this.end == NOT_SET) {
			Node unode = union.unique(this.name);
			if (unode != null)
				this.seq = unode.seq; // Else leave seq as NOT_SET
			if (this.children != null) {
				int start = Integer.MAX_VALUE;
				int end = -1;
				for (Node child : this.children) {
					child.getBracket(union);
					if (child.start < start) start = child.start;
					if (child.end > end) end = child.end;
					if (child.seq != NOT_SET) {
						if (child.seq < start) start = child.seq;
						if (child.seq > end) end = child.seq+1;
					}
				}
				this.start = start;
				this.end = end;
			}
		}
	}

	// Cheaper test, without seeking a witness
	boolean isNotSubsumedBy(Node unode) {
		this.getBracket(unode.taxonomy);
		return this.start < unode.start || this.end > unode.end; // spills out?
	}

	// Look for a member of this source taxon that's not a member of the union taxon,
	// but is a member of some other union taxon.
	Node antiwitness(Node unode) {
		getBracket(unode.taxonomy);
		if (this.start >= unode.start && this.end <= unode.end)
			return null;
		else if (this.children != null) { // it *will* be nonnull actually
			for (Node child : this.children)
				if (child.seq != NOT_SET && (child.seq < unode.start || child.seq >= unode.end))
					return child;
				else {
					Node a = child.antiwitness(unode);
					if (a != null) return a;
				}
		}
		return null;			// Shouldn't happen
	}

	// Look for a member of the source taxon that's also a member of the union taxon.
	Node witness(Node unode) { // assumes is subsumed by unode
		getBracket(unode.taxonomy);
		if (this.start >= unode.end || this.end <= unode.start) // Nonoverlapping => lose
			return null;
		else if (this.children != null) { // it *will* be nonnull actually
			for (Node child : this.children)
				if (child.seq != NOT_SET && (child.seq >= unode.start && child.seq < unode.end))
					return child;
				else {
					Node a = child.witness(unode);
					if (a != null) return a;
				}
		}
		return null;			// Shouldn't happen
	}

	// Find a near-ancestor (parent, grandparent, etc) node that's in
	// common with the other taxonomy
	Node scan(Taxonomy other) {
		Node up = this.parent;

		// Cf. informative() method
		// Without this we get ambiguities when the taxon is a species
		while (up != null && this.name.startsWith(up.name))
			up = up.parent;

		while (up != null && other.lookup(up.name) == null)
			up = up.parent;
		return up;
	}

	int depth = -1;
	int getDepth() {
		if (this.depth < 0) {
			if (this.parent == null)
				this.depth = 0;
			else
				this.depth = this.parent.getDepth() + 1;
		}
		return this.depth;
	}
	int measureDepth() {		// Robust in presence of insertions
		if (this.parent == null)
			this.depth = 0;
		else
			this.depth = this.parent.measureDepth() + 1;
		return this.depth;
	}

	Node mrca(Node b) {
		if (b == null) return null; // Shouldn't happen, but...
		else {
			Node a = this;
			while (a.getDepth() > b.getDepth())
				a = a.parent;
			while (b.getDepth() > a.getDepth())
				b = b.parent;
			while (a != b) {
				a = a.parent;
				b = b.parent;
			}
			return a;
		}
	}

	void appendNewickTo(StringBuffer buf) {
		if (this.children != null) {
			buf.append("(");
			Collections.sort(this.children, compareNodes);
			Node last = children.get(this.children.size()-1);
			for (Node child : children) {
				child.appendNewickTo(buf);
				if (child != last)
					buf.append(",");
			}
			buf.append(")");
		}
		if (this.name != null)
			buf.append(name);
	}

	static Comparator<Node> compareNodes = new Comparator<Node>() {
		public int compare(Node x, Node y) {
			return x.name.compareTo(y.name);
		}
	};

}

// Consider all possible assignments

class Matrix {

	Answer[][] suppressp;
	List<Node> nodes;
	List<Node> unodes;
	int m;
	int n;

	Matrix(List<Node> nodes, List<Node> unodes) {
		this.nodes = nodes;
		this.unodes = unodes;
		m = nodes.size();
		n = unodes.size();
	}

	void clear() {
		suppressp = new Answer[m][];
		for (int i = 0; i < m; ++i)
			suppressp[i] = new Answer[n];
	}

	// Compare every node to every other node, according to a list of criteria.
	void run(Criterion[] criteria) {
		clear();

		// Take already-mapped nodes out of the running
		for (int i = 0; i < m; ++i)
			if (nodes.get(i).mapped != null) {
				Answer answer = Answer.weakNo(nodes.get(i), null, "lost-race", null);
				for (int j = 0; j < n; ++j)
					suppressp[i][j] = answer; // never happens?
			}

		// Similarly, prevent synonyms (???? do we really want to do this?)
		for (int j = 0; j < n; ++j)
			if (unodes.get(j).comapped != null) {
				Answer answer = Answer.weakNo(null, unodes.get(j), "no-synonyms", null);
				for (int i = 0; i < m; ++i)
					suppressp[i][j] = answer;
			}

		for (Criterion criterion : criteria)
			run(criterion);

		// see if any source node remains unassigned (ties or blockage)
		postmortem();
	}

	// Returns true iff any remain unresolved at the end
	void run(Criterion criterion) {
		int m = nodes.size();
		int n = unodes.size();
		int[] uniq = new int[m];	// union nodes uniquely assigned to each source node
		for (int i = 0; i < m; ++i) uniq[i] = -1;
		int[] uuniq = new int[n];	// source nodes uniquely assigned to each union node
		for (int j = 0; j < n; ++j) uuniq[j] = -1;
		Answer[] answer = new Answer[m];
		Answer[] uanswer = new Answer[n];

		for (int i = 0; i < m; ++i) { // For each source node...
			Node x = nodes.get(i);
			for (int j = 0; j < n; ++j) {  // Find a union node to map it to...
				if (suppressp[i][j] != null) continue;
				Node y = unodes.get(j);
				Answer z = criterion.assess(x, y);
				if (z.value == 0)
					continue;
				((UnionTaxonomy)y.taxonomy).log(z);
				if (z.value < Answer.DUNNO) {
					suppressp[i][j] = z;
					continue;
				}
				if (answer[i] == null || z.value > answer[i].value) {
					uniq[i] = j;
					answer[i] = z;
				} else if (z.value == answer[i].value)
					uniq[i] = -2;

				if (uanswer[j] == null || z.value > uanswer[j].value) {
					uuniq[j] = i;
					uanswer[j] = z;
				} else if (z.value == uanswer[j].value)
					uuniq[j] = -2;
			}
		}
		for (int i = 0; i < m; ++i)
			// Don't assign a source node to two union nodes...
			if (uniq[i] >= 0) {
				int j = uniq[i];
				// Avoid assigning two source nodes to the same union node (synonyms)...
				if (uuniq[j] >= 0 && suppressp[i][j] == null) {
					Node x = nodes.get(i); // == uuniq[j]
					Node y = unodes.get(j);
					x.unifyWith(y);
					y.markEvent(answer[i].reason);
					for (int ii = 0; ii < m; ++ii)
						if (ii != i && suppressp[ii][j] == null)
							suppressp[ii][j] = Answer.no(nodes.get(ii), y, "excluded", x.getQualifiedId());
					for (int jj = 0; jj < n; ++jj)
						if (jj != j && suppressp[i][jj] == null)
							suppressp[i][jj] = Answer.no(x, unodes.get(jj), "coexcluded", null);  // never happens?
					suppressp[i][j] = answer[i];
				}
			}
	}

	// Record reasons for failure - for each unmapped source node, why didn't it map?
	boolean postmortem() {
		boolean morep = false;
		for (int i = 0; i < m; ++i) {
			Node node = nodes.get(i);
			if (node.mapped == null) {
				// The explanation lies (mostly) in suppressp[i]
				int alts = 0;
				for (int j = 0; j < n; ++j)
					if (suppressp[i][j] == null) ++alts;
				UnionTaxonomy union = (UnionTaxonomy)unodes.get(0).taxonomy;
				Answer explanation;
				if (alts == 1)
					// There must be multiple source nodes competing
					// for this one union node (if synonyms are quashed)
					explanation = Answer.noinfo(node, null, "unresolved/contention", null);
				else if (alts > 0)
					// Multiple union nodes to which this source can map... no way to tell
					explanation = Answer.noinfo(node, null, "unresolved/ambiguous", null);
				else {
					// Important case, mapping blocked, give gory details
					for (int j = 0; j < n; ++j)
						union.log(suppressp[i][j]);
					String kludge = null;
					int badness = -100;
					for (int j = 0; j < n; ++j) {
						if (suppressp[i][j].value > badness)
							badness = suppressp[i][j].value;
						if (kludge == null)
							kludge = suppressp[i][j].reason;
						else
							kludge = kludge + "," + suppressp[i][j].reason;
					}
					explanation = new Answer(node, null, badness, "unresolved/blocked", kludge);
				}
				union.logAndMark(explanation);
				// remember, this could be either gbif or idsource
				node.deprecationReason = explanation;  
				morep = true;
			}
		}
		return morep;
	}
}

// Assess a criterion for judging whether x <= y or not x <= y
// Positive means yes, negative no, zero I couldn't tell you
// x is source node, y is union node

abstract class Criterion {

	abstract Answer assess(Node x, Node y);

	// Ciliophora = ncbi:5878 = gbif:10 != gbif:3269382
	static long[][] exceptions = {
		{5878, 10, 3269382},	// Ciliophora
		{29178, 389, 4983431}};	// Foraminifera

	// This is obviously a horrible kludge, awaiting a rewrite
	static Criterion adHoc =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (!x.taxonomy.tag.equals("gbif")) return Answer.NOINFO;
				Node source = null;
				for (Node ysource : y.sourcenodes)
					if (ysource != null) { source = ysource; break; }
				if (source == null) return Answer.NOINFO;
				if (!source.taxonomy.tag.equals("ncbi")) return Answer.NOINFO;
				for (long[] exception : exceptions)
					if (source.id == exception[0]) {
						if (x.id == exception[1])
							return Answer.yes(x, y, "ad-hoc", null);
						else
							return Answer.no(x, y, "ad-hoc-not", null);
					}
				return Answer.NOINFO;
			}
		};

	static Criterion division =
		new Criterion() {
			Answer assess(Node x, Node y) {
				String xdiv = x.getDivision();
				String ydiv = y.getDivision();
				if (xdiv == ydiv)
					return Answer.NOINFO;
				else if (xdiv != null && ydiv != null) {
					Answer a = Answer.heckNo(x, y, "different-division", xdiv);
					return a;
				} else
					return Answer.NOINFO;
			}
		};

	// x is source node, y is union node

	static Criterion lineage =
		new Criterion() {
			Answer assess(Node x, Node y) {
				Node y0 = y.scan(x.taxonomy);	  // ignore names not known in both taxonomies
				Node x0 = x.scan(y.taxonomy);
				if (x0 == null && y0 == null)
					return Answer.heckYes(x, y, "both-at-top", null); // Both are roots
				if (x0 == null || y0 == null)
					return Answer.NOINFO;

				if (x0.name.equals(y0.name))
					return Answer.heckYes(x, y, "same-parent/direct", x0.name);
				else if (online(x0.name, y0))
					// was heckYes; differentiating the two levels
					// helps to deal with the Nitrospira situation (7 instances)
					return Answer.yes(x, y, "same-parent/extended-l", x0.name);
				else if (online(y0.name, x0))
					return Answer.yes(x, y, "same-parent/extended-r", y0.name);
				else
					// Incompatible parents.  Who knows what to do.
					return Answer.NOINFO;
			}
		};

	static boolean online(String name, Node node) {
		for ( ; node != null; node = node.parent)
			if (node.name.equals(name)) return true;
		return false;
	}

	static Criterion subsumption =
		new Criterion() {
			Answer assess(Node x, Node y) {
				Node a = x.antiwitness(y);
				Node b = x.witness(y);
				if (b != null) { // good
					if (a == null)	// good
						// 2859
						return Answer.heckYes(x, y, "is-subsumed-by", b.name);
					else
						// 94
						return Answer.yes(x, y, "overlaps", b.name);
				} else {
					if (a == null)
						// ?
						return Answer.NOINFO;
					else		// bad
						// 13 ?
						return Answer.no(x, y, "incompatible-with", a.name);
				}
			}
		};

	// E.g. Paraphelenchus
	static Criterion elimination =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (!x.rank.equals(y.rank)) {
					return Answer.weakYes(x, y, "by-elimination/different-ranks", null);
				} else if (x.children != null && y.children != null) {
					return Answer.weakYes(x, y, "by-elimination/internal", null);
				} else {
					return Answer.weakYes(x, y, "by-elimination/tip", null);
				}
			}
		};

	static Criterion[] criteria = { adHoc, division, lineage, subsumption, elimination };

	static Criterion[] idCriteria = { adHoc, division, lineage, subsumption, elimination };

}

// Values for 'answer'
//	 3	 good match - to the point of being uninteresting
//	 2	 yes  - some evidence in favor, maybe some evidence against
//	 1	 weak yes  - evidence from name only
//	 0	 no information
//	-1	 weak no - some evidence against
//	-2	  (not used)
//	-3	 no brainer - gotta be different


class Answer {
	Node x, y;					// The question is: Should x be mapped to y?
	int value;
	String reason;
	String witness;
	//gate c14
	Answer(Node x, Node y, int value, String reason, String witness) {
		this.x = x; this.y = y;
		this.value = value;
		this.reason = reason;
		this.witness = witness;
	}

	static final int HECK_YES = 3;
	static final int YES = 2;
	static final int WEAK_YES = 1;
	static final int DUNNO = 0;
	static final int WEAK_NO = -1;
	static final int NO = -2;
	static final int HECK_NO = -3;

	static Answer heckYes(Node x, Node y, String reason, String witness) { // Uninteresting
		return new Answer(x, y, HECK_YES, reason, witness);
	}

	static Answer yes(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, YES, reason, witness);
	}

	static Answer weakYes(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, WEAK_YES, reason, witness);
	}

	static Answer noinfo(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, DUNNO, reason, witness);
	}

	static Answer weakNo(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, WEAK_NO, reason, witness);
	}

	static Answer no(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, NO, reason, witness);
	}

	static Answer heckNo(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, HECK_NO, reason, witness);
	}

	static Answer NOINFO = new Answer(null, null, DUNNO, "no-info", null);

	// Does this determination warrant the display of the log entries
	// for this name?
	boolean isInteresting() {
		return (this.value < HECK_YES) && (this.value > HECK_NO) && (this.value != DUNNO);
	}

	String dump() {
		return
			(((this.y != null ? this.y.name :
			   (this.x != null ? this.x.name : "?")))
			 + "\t" +

			 (this.x != null ? this.x.getQualifiedId() : "?") + "\t" +

			 (this.value > DUNNO ?
			  "yes" :
			  (this.value < DUNNO ? "no" : "-")) + "\t" +

			 this.reason + "\t" +

			 (this.y == null ? "?" : this.y.id) + "\t" +

			 (this.witness == null ? "" : this.witness) );
	}

	// How many taxa would we lose if we didn't import this part of the tree?
	int lossage (Node node) {
		int n = 1;
		if (node.children != null)
			for (Node child : node.children)
				if (child.mapped == null || child.mapped.novelp)
					n += lossage(child);
		return n;
	}
}

class NodeRef {
	String tag;
	long id;
	NodeRef(String tag, long id) {
		this.tag = tag; this.id = id;
	}
	NodeRef(String qid) {
		String[] foo = qid.split(":");
		if (foo.length != 2)
			throw new RuntimeException("ill-formed qualified id: " + qid);
		this.tag = foo[0]; this.id = Long.parseLong(foo[1]);
	}
	public String toString() {
		return tag + ":" + id;
	}
}