/*

  JAR's taxonomy combiner.

  Some people think having multiple classes in one file, or unpackaged
  classes, is terrible programming style...	 I'll split into multiple
  files when I'm ready to do so; currently it's much easier to work
  with in this form.

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
import org.json.simple.JSONObject; 
import org.json.simple.parser.JSONParser; 
import org.json.simple.parser.ParseException;

public class Smasher {

	public static void main(String argv[]) throws Exception {

		Taxonomy.initRanks();

		if (argv.length > 0) {

			Taxonomy tax = null;
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
						UnionTaxonomy union = tax.promote(); tax = union;
						union.assignIds(idsource);
					}

					else if (argv[i].equals("--aux")) { // preottol
						UnionTaxonomy union = tax.promote(); tax = union;
						SourceTaxonomy auxsource = getSourceTaxonomy(argv[++i]);
						union.loadAuxIds(auxsource, idsource);
                        union.dumpAuxIds(outprefix);
					}

					else if (argv[i].equals("--start")) {
						tax = new SourceTaxonomy();
						getTaxonomy(tax, argv[++i]);    // Directory name, ending in /
					}

					else if (argv[i].equals("--select")) {
						String name = argv[++i];
						Node root = tax.unique(name);
						if (root != null) {
							tax.analyze();    // otherwise they all show up as 'barren'
							tax.dump(root, argv[++i]);
						}
					}

					else if (argv[i].equals("--edits")) {
						String dirname = argv[++i];
						UnionTaxonomy union = tax.promote(); tax = union;
						union.edit(dirname);
					}

					//-----
					else if (argv[i].equals("--out")) {
						outprefix = argv[++i];
						UnionTaxonomy union = tax.promote(); tax = union;
						union.dumpAll(outprefix);
					}

					else if (argv[i].equals("--test"))
						test();

					else if (argv[i].equals("--tre")) {
						String outfile = argv[++i];
						tax.dumpNewick(outfile);
					}

					else if (argv[i].equals("--newick")) {
						System.out.println(" -> " + tax.toNewick());
					}

					// Utility
					else if (argv[i].equals("--join")) {
						String afile = argv[++i];
						String bfile = argv[++i];
						join(afile, bfile);
					}

					else System.err.println("Unrecognized directive: " + argv[i]);
				}

				else {
					SourceTaxonomy source = getSourceTaxonomy(argv[i]);
					if (tax == null)
						tax = source;
					else {
						UnionTaxonomy union = tax.promote(); tax = union;
						union.mergeIn(source);
					}
				}
			}
		}
	}

	static SourceTaxonomy getSourceTaxonomy(String designator) throws IOException {
		SourceTaxonomy tax = new SourceTaxonomy();
		getTaxonomy(tax, designator);
		return tax;
	}

	static void getTaxonomy(Taxonomy tax, String designator) throws IOException {
		if (designator.startsWith("("))
			tax.roots.add(tax.newickToNode(designator));
		else {
            if (!designator.endsWith("/")) {
                System.err.println("Taxonomy designator should end in / but doesn't: " + designator);
                designator = designator + "/";
            }
			System.out.println("--- Reading " + designator + " ---");
			tax.loadTaxonomy(designator);
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
		Map<String, String[]> a = readTable(afile);
		Map<String, String[]> b = readTable(bfile);
		for (String id : a.keySet()) {
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

	static Map<String, String[]> readTable(String filename) throws IOException {
		FileReader fr = new FileReader(filename);
		BufferedReader br = new BufferedReader(fr);
		String str;
		Map<String, String[]> rows = new HashMap<String, String[]>();
		while ((str = br.readLine()) != null) {
			String[] parts = tabPattern.split(str);
			rows.put(parts[0], parts);
		}
		fr.close();
		return rows;
	}
}

abstract class Taxonomy implements Iterable<Node> {
	Map<String, List<Node>> nameIndex = new HashMap<String, List<Node>>();
	Map<String, Node> idIndex = new HashMap<String, Node>();
	Set<Node> roots = new HashSet<Node>(1);
	int which = -1;
	protected String tag = null;
	int nextSequenceNumber = 0;
	String[] header = null;

	Integer sourcecolumn = null;
	Integer sourceidcolumn = null;
	Integer infocolumn = null;
	Integer preottolcolumn = null;

	Taxonomy() { }

	public String toString() {
		return "(taxonomy " + (tag != null ? tag : "?") + ")";
	}

	abstract UnionTaxonomy promote();

	List<Node> lookup(String name) {
		return this.nameIndex.get(name);
	}

	Node unique(String name) {
		List<Node> probe = this.nameIndex.get(name);
		// TBD: Maybe rule out synonyms?
		if (probe != null && probe.size() == 1)
			return probe.get(0);
		else 
			return this.idIndex.get(name);
	}

	boolean homonymp(String name) {
		List<Node> probe = this.nameIndex.get(name);
		// TBD: Maybe rule out synonyms?
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

	int count() {
		int total = 0;
		for (Node root : this.roots)
			total += root.count();
		return total;
	}

	// Iterate over all nodes reachable from roots

	public Iterator<Node> iterator() {
		final List<Iterator<Node>> its = new ArrayList<Iterator<Node>>();
		its.add(this.roots.iterator());
		final Node[] current = new Node[1]; // locative
		current[0] = null;

		return new Iterator<Node>() {
			public boolean hasNext() {
				if (current[0] != null) return true;
				while (true) {
					if (its.size() == 0) return false;
					if (its.get(0).hasNext()) return true;
					else its.remove(0);
				}
			}
			public Node next() {
				Node node = current[0];
				if (node != null)
					current[0] = null;
				else
					// Caller has previously called hasNext(), so we're good to go
					// Was: .get(its.size()-1)
					node = its.get(0).next();
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
		if (this.tag != null) return;
		List<Node> probe = this.lookup("Caenorhabditis elegans");
		if (probe == null)
			this.tag = "tax" + this.which;
		else {
			String id = probe.get(0).id;
			if (id.equals("6239")) this.tag = "ncbi";
			else if (id.equals("2283683")) this.tag = "gbif";
			else if (id.equals("395048")) this.tag = "ott";
			else if (id.equals("100968828")) this.tag = "aux";
			else if (id.equals("4722")) this.tag = "nem"; // testing
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
				boolean sibhomsp = false;
				boolean cuzhomsp = false;
				for (Node n1: nodes)
					for (Node n2: nodes)
						if (n1.id.compareTo(n2.id) < 0) {
							if (n1.parent == n2.parent)
								sibhomsp = true;
							else if (n1.parent != null && n2.parent != null &&
									 n1.parent.parent == n2.parent.parent)
								cuzhomsp = true;
						}
				if (sibhomsp) ++sibhoms;
				if (cuzhomsp) ++cousinhoms;
			}
		if (homs > 0) {
			System.out.println("| " + homs + " homonyms, of which " +
							   cousinhoms + " name cousin taxa, " +
							   sibhoms + " name sibling taxa");
		}
	}

	static Pattern tabVbarTab = Pattern.compile("\t\\|\t?");

	void loadTaxonomy(String dirname) throws IOException {
		loadMetadata(dirname + "about.json");

        String filename = dirname + "taxonomy.tsv";
		FileReader fr = new FileReader(filename);
		BufferedReader br = new BufferedReader(fr);
		String str;
		int row = 0;

		while ((str = br.readLine()) != null) {
			String[] parts = tabVbarTab.split(str + "!");    // Java loses
			if (parts.length < 3) {
				System.out.println("Bad row: " + row + " has " + parts.length + " parts");
			} else {
				if (row == 0) {
					if (parts[0].equals("uid")) {
						Map<String, Integer> headerx = new HashMap<String, Integer>();
						for (int i = 0; i < parts.length; ++i)
							headerx.put(parts[i], i);
						// id | parentid | name | rank | ...
						this.header = parts; // Stow it just in case...
						this.sourcecolumn = headerx.get("source");
						this.sourceidcolumn = headerx.get("sourceid");
						this.infocolumn = headerx.get("sourceinfo");
						this.preottolcolumn = headerx.get("preottol_id");
						continue;
					} else
						System.out.println("! No header row");
				}
				String id = parts[0];
				Node node = this.idIndex.get(id);
				if (node == null) {
					// created earlier because it's the parent of some other node
					node = new Node(this);
					node.setId(id); // stores into this.idIndex
				}

				String parentId = parts[1];
				if (parentId.equals(id))
					System.err.println("!! Taxon is its own parent: " + id);
				else if (parentId.length() > 0) {
					Node parent = this.idIndex.get(parentId);
					if (parent == null) {
						parent = new Node(this);	 //don't know parent's name yet
						parent.setId(parentId);
					}
					parent.addChild(node);
				} else
					roots.add(node);
				node.init(parts); // does setName
			}
			++row;
			if (row % 500000 == 0)
				System.out.println(row);
		}
		fr.close();

		for (Node node : this.idIndex.values()) {
			if (node.name == null) {
				System.err.println("!! Identifier with no associated name, probably a missing parent: " + node.id);
				node.setName("undefined:" + node.id);
			}
			if (node.rank == null || node.rank.length() == 0)
				node.rank = "no rank";
			// if (node.parent == null && !roots.contains(node)) ...
		}

		if (roots.size() == 0)
			System.err.println("*** No root nodes!");
		else {
			if (roots.size() > 1)
				System.err.println("There are " + roots.size() + " roots");
			int total = 0;
			for (Node root : roots)
				total += root.count();
			if (row != total)
				System.err.println(this.getTag() + " is ill-formed: " +
								   row + " rows, " + 
								   total + " reachable from roots");
		}
		loadSynonyms(dirname + "synonyms.tsv");
	}

	void loadMetadata(String filename) throws IOException {
		FileReader fr;
		try {
			fr = new FileReader(filename);
		} catch (java.io.FileNotFoundException e) {
			return;
		}
		JSONParser parser = new JSONParser();
		try {
			Object obj = parser.parse(fr);
			JSONObject jsonObject = (JSONObject) obj;
			// System.out.println(jsonObject);
			Object prefix = ((Map)obj).get("prefix");
			if (prefix != null) {
				System.out.println("prefix is " + prefix);
				this.tag = (String)prefix;
			}
		} catch (ParseException e) {
			System.err.println(e);
		}
		fr.close();
	}

	void loadSynonyms(String filename) throws IOException {
		FileReader fr;
		try {
			fr = new FileReader(filename);
		} catch (java.io.FileNotFoundException e) {
			fr = null;
		}
		if (fr != null) {
			BufferedReader br = new BufferedReader(fr);
			int count = 0;
			String str;
			int syn_column = 1;
			int id_column = 0;
			int row = 0;
			int losers = 0;
			while ((str = br.readLine()) != null) {
				String[] parts = tabVbarTab.split(str);
				// uid | name | type | ? |
				// 36602	|	Sorbus alnifolia	|	synonym	|	|	
				if (parts.length >= 2) {
					if (row == 0) {
						Map<String, Integer> headerx = new HashMap<String, Integer>();
						for (int i = 0; i < parts.length; ++i)
							headerx.put(parts[i], i);
						Integer o2 = headerx.get("uid");
						if (o2 == null) o2 = headerx.get("id");
						if (o2 != null) {
							id_column = o2;
							Integer o1 = headerx.get("name");
							if (o1 != null) syn_column = o1;
							continue;
						}
					}
					String id = parts[id_column];
					String syn = parts[syn_column];
					Node node = this.idIndex.get(id);
					if (node == null) {
						if (++losers < 20)
							System.err.println("Identifier " + id + " unrecognized for synonym " + syn);
						else if (losers == 20)
							System.err.println("...");
						continue;
					}
					List<Node> nodes = this.nameIndex.get(syn);
					if (nodes != null && nodes.contains(node)) {
						if (node.name.equals(syn)) {
							if (++losers < 20)
								System.err.println("Putative synonym " + syn + " is the primary name of " + id);
							else if (losers == 20)
								System.err.println("...");
						} else
							;//lots of these System.err.println("Redundant synonymy: " + id + " " + syn);
						continue;
					}
					if (nodes == null) {
						nodes = new ArrayList<Node>(1);
						this.nameIndex.put(syn, nodes);
					}
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
		out.println("name\t|\tuid\t|\tuniqname\t|\t");
		for (String name : this.nameIndex.keySet())
			for (Node node : this.nameIndex.get(name))
				if (!node.name.equals(name)) {
					String uniq = node.uniqueName();
					if (uniq.length() == 0) uniq = node.name;
					out.println(name + "\t|\t" +
								node.id + "\t|\t" +
								name + " (synonym for " + uniq + ")" +
								"\t|\t");
				}
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
		for (Node root : this.roots)
			analyzeRankConflicts(root);
		for (Node root : this.roots)
			analyze(root, 0);	// mutates the tree
	}

	static final int NOT_OTU             =    1;
	static final int HYBRID          	 =    2;
	static final int VIRAL          	 =    4;
	static final int UNCLASSIFIED 	  	 =    8;
	static final int ENVIRONMENTAL 	  	 =   16;
	static final int INCERTAE_SEDIS 	 =   32;
	static final int SPECIFIC     	     =   64;
	static final int EDITED     	     =  128;
	static final int SIBLING_LOWER       =  512;
	static final int SIBLING_HIGHER      = 1024;
	static final int MAJOR_RANK_CONFLICT = 2048;
	static final int TATTERED 			 = 4096;
	static final int ANYSPECIES			 = 8192;
	static final int FLAGGED			 = 8192 * 2;

	// Returns the node's rank (as an int).  In general the return
	// value should be >= parentRank, but conceivably funny things
	// could happen when combinings taxonomies.

	static int analyzeRankConflicts(Node node) {
		if (node.rank == null) node.rank = "no rank"; //kludge
		Integer m = ranks.get(node.rank);    // no rank = -1
		if (m == null) {
			System.err.println("Unrecognized rank: " + node);
			m = ranks.get("no rank");
		}
		int myrank = m;
		node.rankAsInt = myrank;

		if (node.children != null) {

			int highrank = Integer.MAX_VALUE; // highest rank among all children
			int lowrank = -1;
			Node highchild = null;

			// Preorder traversal
			// In the process, calculate rank of highest child
			for (Node child : node.children) {
				int rank = analyzeRankConflicts(child);
				if (rank >= 0) {
					if (rank < highrank) { highrank = rank; highchild = child; }
					if (rank > lowrank)  lowrank = rank;
				}
			}

			if (lowrank >= 0) {	// Any non-"no rank" children?

				// highrank is the highest (lowest-numbered) rank among all the children.
				// Similarly lowrank.  If they're different we have a 'rank conflict'.
				// Some 'rank conflicts' are 'minor', others are 'major'.
				if (highrank < lowrank) {
					// Suppose the parent is a class. We're looking at relative ranks of the children...
					// Two cases: order/family (minor), order/genus (major)
					int x = highrank / 100;       //e.g. order
					for (Node child : node.children) {
						int sibrank = child.rankAsInt;     //e.g. family or genus
						if (sibrank < 0) continue;		   // skip "no rank" children
						// we know sibrank >= highrank
						if (sibrank < lowrank)  // if child is higher rank than some sibling...
							// a family that has a sibling that's a genus
							// SIBLING_LOWER means 'has a sibling with lower rank'
							child.properFlags |= SIBLING_LOWER; //e.g. family with genus sibling
						if (sibrank > highrank) {  // if lower rank than some sibling
							int y = (sibrank + 99) / 100; //genus->genus, subfamily->genus
							if (y > x+1)
								// e.g. a genus that has an order as a sibling
								child.properFlags |= MAJOR_RANK_CONFLICT;
							else
								child.properFlags |= SIBLING_HIGHER; //e.g. genus with family sibling
						}
					}

					// Extra informational check.  See if ranks are inverted.
					if (myrank >= 0 && myrank > highrank)
						// The myrank == highrank case is weird too; there are about 200 of those.
						System.err.println("** Ranks out of order: " +
										   node + " " + node.rank + " has child " +
										   highchild + " " + highchild.rank);
				}
			}
		}
		return myrank;
	}

	// Each Node has two parallel sets of flags: 
	//   proper - applies particularly to this node
	//   inherited - applies to this node because it applies to an ancestor
	//     (where in some cases the ancestor may later be 'elided' so
	//     not an ancestor any more)

	static void analyze(Node node, int inheritedFlags) {
		// Before
		node.inheritedFlags |= inheritedFlags;
		boolean anyspeciesp = false;     // Any descendant is a species?
		boolean elidep = false;

		// Prepare for recursive descent
		if (notOtuRegex.matcher(node.name).find()) 
			node.properFlags |= NOT_OTU;
		if (hybridRegex.matcher(node.name).find()) 
			node.properFlags |= HYBRID;
		if (viralRegex.matcher(node.name).find()) 
			node.properFlags |= VIRAL;

		if (unclassifiedRegex.matcher(node.name).find()) {// Rule 3+5
			node.properFlags |= UNCLASSIFIED;
			elidep = true;
		}
		if (environmentalRegex.matcher(node.name).find()) {// Rule 3+5
			node.properFlags |= ENVIRONMENTAL;
			elidep = true;
		}
		if (incertae_sedisRegex.matcher(node.name).find()) {// Rule 3+5
			node.properFlags |= INCERTAE_SEDIS;
			elidep = true;
		}
		if (node.rank.equals("species") || node.rank.equals("sample")) {
			node.properFlags |= SPECIFIC;
			anyspeciesp = true;
		}

		int bequest = inheritedFlags | node.properFlags;		// What the children inherit

		// Recursive descent
		if (node.children != null)
			for (Node child : new ArrayList<Node>(node.children)) {
				analyze(child, bequest);
				if ((child.properFlags & ANYSPECIES) != 0) anyspeciesp = true;
			}

		// After
		if (anyspeciesp) node.properFlags |= ANYSPECIES;
		if (elidep) elide(node);
	}

	// Splice the node out of the hierarchy, but leave it as a
	// residual terminal non-OTU node
	static void elide(Node node) {
		if (node.children != null && node.parent != null)
			for (Node child : new ArrayList<Node>(node.children))
				child.changeParent(node.parent);
		node.properFlags |= NOT_OTU;
	}

	static void printFlags(Node node, PrintStream out) {
		boolean needComma = false;
		if ((((node.properFlags | node.inheritedFlags) & NOT_OTU) != 0)
			|| ((node.inheritedFlags & ENVIRONMENTAL) != 0)) {
			if (needComma) out.print(","); else needComma = true;
			out.print("not_otu");
		}
		if (((node.properFlags | node.inheritedFlags) & VIRAL) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("viral");
		}
		if (((node.properFlags | node.inheritedFlags) & HYBRID) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("hybrid");
		}

		if ((node.properFlags & INCERTAE_SEDIS) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("incertae_sedis_direct");
		}
		if ((node.inheritedFlags & INCERTAE_SEDIS) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("incertae_sedis_inherited");
		}

		if ((node.properFlags & UNCLASSIFIED) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("unclassified_direct");  // JAR prefers 'unclassified'
		}
		if ((node.inheritedFlags & UNCLASSIFIED) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("unclassified_inherited"); // JAR prefers 'unclassified_indirect' ?
		}

		if ((node.properFlags & ENVIRONMENTAL) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("environmental");
		}

		if ((node.properFlags & SIBLING_HIGHER) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("sibling_higher");
		}
		if ((node.properFlags & SIBLING_LOWER) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("sibling_lower");
		}

		if ((node.properFlags & MAJOR_RANK_CONFLICT) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("major_rank_conflict_direct");
		}
		if ((node.inheritedFlags & MAJOR_RANK_CONFLICT) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("major_rank_conflict_inherited");
		}

		if ((node.properFlags & TATTERED) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("tattered");
		}

		if ((node.properFlags & EDITED) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("edited");
		}

		if ((node.properFlags & FLAGGED) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("flagged");
		}

		if ((node.inheritedFlags & SPECIFIC) != 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("infraspecific");
		} else if ((node.properFlags & ANYSPECIES) == 0) {
			if (needComma) out.print(","); else needComma = true;
			out.print("barren");
		}
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

	static Pattern hybridRegex = Pattern.compile("\\bx\\b|\\bhybrid\\b");

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

	static Pattern incertae_sedisRegex = Pattern.compile("\\bincertae sedis\\b|\\bIncertae sedis\\b|\\bIncertae Sedis\\b");

	static String[][] rankStrings = {
		{"domain",
		 "superkingdom",
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
		 "subform",
		 "sample"},
	};

	static Map<String, Integer> ranks = new HashMap<String, Integer>();

	static void initRanks() {
		for (int i = 0; i < rankStrings.length; ++i) {
			for (int j = 0; j < rankStrings[i].length; ++j)
				ranks.put(rankStrings[i][j], (i+1)*100 + j*10);
		}
		ranks.put("no rank", -1);
	}

	void dump(Node node, String filename) throws IOException {
		List<Node> it = new ArrayList<Node>(1);
		it.add(node);
		this.dump(it, filename);
	}

	void dump(Collection<Node> nodes, String filename) throws IOException {
		PrintStream out = Taxonomy.openw(filename);

		out.println("uid\t|\tparent_uid\t|\tname\t|\trank\t|\tsourceinfo\t|\tuniqname\t|\tflags\t|\t"
					// 0	 1				2		 3		  4				 5             6
					);

		for (Node node : nodes) {
			if (node == null)
				System.err.println("null in nodes list!?" );
			else
				dumpNode(node, out, true);
		}
		out.close();
	}

	// Recursive!
	void dumpNode(Node node, PrintStream out, boolean rootp) {
		// 0. uid:
		out.print((node.id == null ? "?" : node.id) + "\t|\t");
		// 1. parent_uid:
		out.print(((node.parent == null || rootp) ? "" : node.parent.id)  + "\t|\t");
		// 2. name:
		out.print((node.name == null ? "?" : node.name)
				  + "\t|\t");
		// 3. rank:
		out.print((node.rank == null ? "no rank" : node.rank) + "\t|\t");

		// 4. source information
		// comma-separated list of URI-or-CURIE
		out.print(node.getSourceIdsString() + "\t|\t");

		// 5. uniqname
		out.print(node.uniqueName() + "\t|\t");

		// 6. flags
		// (node.mode == null ? "" : node.mode)
		Taxonomy.printFlags(node, out);
		out.print("\t|\t");
		// was: out.print(((node.flags != null) ? node.flags : "") + "\t|\t");

		out.println();

		if (node.children != null)
			for (Node child : node.children) {
				if (child == null)
					System.err.println("null in children list!? " + node);
				else
					dumpNode(child, out, false);
			}
	}

	// -------------------- Newick stuff --------------------
	// Render this taxonomy as a Newick string.
	// This feature is very primitive and only for debugging purposes!

	String toNewick() {
		StringBuffer buf = new StringBuffer();
		for (Node root: this.roots) {
			root.appendNewickTo(buf);
			buf.append(";");
		}
		return buf.toString();
	}

	void dumpNewick(String outfile) throws java.io.IOException {
		PrintStream out = openw(outfile);
		out.print(this.toNewick());
		out.close();
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

	// TO BE DONE: Implement ; for reading forests

	Node newickToNode(java.io.PushbackReader in) throws java.io.IOException {
		int c = in.read();
		if (c == '(') {
			List<Node> children = new ArrayList<Node>();
			{
				Node child;
				while ((child = newickToNode(in)) != null) {
					children.add(child);
					int d = in.read();
					if (d < 0 || d == ')') break;
					if (d != ',')
						System.out.println("shouldn't happen: " + d);
				}
			}
			Node node = newickToNode(in); // get postfix name, x in (a,b)x
			if (node != null || children.size() > 0) {
				if (node == null) {
					node = new Node(this);
					// kludge
					node.setName("");
				}
				for (Node child : children)
					node.addChild(child);
				node.rank = (children.size() > 0) ? "no rank" : "species";
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
						node.rank = "species";
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

	long maxid() {
		long id = Long.MIN_VALUE;
		for (Node node : this) {
			long idAsLong;
			try {
				idAsLong = Long.parseLong(node.id);
				if (idAsLong > id) id = idAsLong;
			} catch (NumberFormatException e) {
				;
			}
		}
		return id;
	}

}  // End of class Taxonomy

class SourceTaxonomy extends Taxonomy {

	// Used by idsource
	List<Answer> deprecated = new ArrayList<Answer>();

	SourceTaxonomy() {
	}

	UnionTaxonomy promote() {
		return new UnionTaxonomy(this);
	}

	void mapInto(UnionTaxonomy union, Criterion[] criteria) {

		if (this.roots.size() > 0) {

			Node.resetStats();
			System.out.println("--- Mapping " + this.getTag() + " into union ---");

			union.sources.add(this);

			int beforeCount = union.nameIndex.size();

			for (Node root: union.roots) {
				// Clear out gumminess from previous merges
				root.reset();

				// Prepare for subsumption checks
				root.assignBrackets();
			}

			this.pin(union);

			// Consider all matches where names coincide.
			// When matching P homs to Q homs, we get PQ choices of which
			// possibility to attempt first.
			// Treat each name separately.

			// Be careful about the order in which names are
			// processed, so as to make the 'races' come out the right
			// way.  This is a kludge.

			Set<String> seen = new HashSet<String>();
			List<String> todo = new ArrayList<String>();
			// true / true
			for (Node node : this)
				if (!seen.contains(node.name)) {
					List<Node> unodes = union.nameIndex.get(node.name);
					if (unodes != null)
						for (Node unode : unodes)
							if (unode.name.equals(node.name))
								{ seen.add(node.name); todo.add(node.name); break; }
				}
			// true / synonym
			for (Node node : union)
				if (this.nameIndex.get(node.name) != null &&
					!seen.contains(node.name))
					{ seen.add(node.name); todo.add(node.name); }
			// synonym / true
			for (Node node : this)
				if (union.nameIndex.get(node.name) != null &&
					!seen.contains(node.name))
					{ seen.add(node.name); todo.add(node.name); }
			// synonym / synonym
			for (String name : this.nameIndex.keySet())
				if (union.nameIndex.get(name) != null &&
					!seen.contains(name))
					{ seen.add(name); todo.add(name); }

			int incommon = 0;
			for (String name : todo) {
				List<Node> unodes = union.nameIndex.get(name);
				if (unodes != null) {
					++incommon;
					List<Node> nodes = this.nameIndex.get(name);
					new Matrix(name, nodes, unodes).run(criteria);
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
				else if (node.mapped.novelp)
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
			{"Arthropoda"},		// Tetrapoda, Theria
			{"Chordata"},
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

	void augment(UnionTaxonomy union) {
		if (this.roots.size() > 0) {

			// Add heretofore unmapped nodes to union
			if (Node.windyp)
				System.out.println("--- Augmenting union with new nodes from " + this.getTag() + " ---");
			int startcount = union.count();
			int startroots = union.roots.size();

			for (Node root : this.roots) {

				// 'augment' always returns a node in the union tree, or null
				Node newroot = root.augment(union);

				if (newroot != null && newroot.parent == null && !union.roots.contains(newroot))
					union.roots.add(newroot);
			}

			// Tidy up the root set:
			List<Node> losers = new ArrayList<Node>();
			for (Node root : union.roots)
				if (root.parent != null) {
					System.out.println("| No longer a root: " + root);
					losers.add(root);
				}
			for (Node loser : losers)
				union.roots.remove(loser);

			// Sanity check:
			for (Node unode : union)
				if (unode.parent == null && !union.roots.contains(unode))
					System.err.println("| Missing root: " + unode);

			if (Node.windyp) {
				System.out.println("| Started with:		 " +
								   startroots + " trees, " + startcount + " taxa");
				Node.augmentationReport();
				System.out.println("| Ended with:		 " +
								   union.roots.size() + " trees, " + union.count() + " taxa");
			}
			if (union.nameIndex.size() < 10)
				System.out.println(" -> " + union.toNewick());
		}
	}
	
	// Propogate synonyms from source taxonomy to union.
	// Some names that are synonyms in the source might be primary names in the union,
	//  and vice versa.
	void copySynonyms(UnionTaxonomy union) {
		int count = 0;
		for (String syn : this.nameIndex.keySet()) {
			// All of the nodes for which syn is a name:
			List<Node> fromnodes = this.nameIndex.get(syn);
			List<Node> tonodes = union.nameIndex.get(syn);

			// a is a synonym of b, c, and d
			for (Node node : fromnodes) {
				// Only mapped nodes can have their names preserved as synonyms
				if (node.mapped != null) {
					if (tonodes == null) {
						tonodes = new ArrayList<Node>(1);
						union.nameIndex.put(syn, tonodes);
					}
					if (!tonodes.contains(node.mapped)) {
						tonodes.add(node.mapped);
						++count;
					}
				}
			}
		}
		if (count > 0)
			System.err.println("| Copied " + count + " synonyms");
	}

	static SourceTaxonomy readTaxonomy(String filename) throws IOException {
		SourceTaxonomy tax = new SourceTaxonomy();
		tax.loadTaxonomy(filename);
		return tax;
	}

	static SourceTaxonomy parseNewick(String newick) {
		SourceTaxonomy tax = new SourceTaxonomy();
		tax.roots.add(tax.newickToNode(newick));
		return tax;
	}
}

class UnionTaxonomy extends Taxonomy {

	List<SourceTaxonomy> sources = new ArrayList<SourceTaxonomy>();
	SourceTaxonomy idsource = null;
	SourceTaxonomy auxsource = null;
	// One log per name
	Map<String, List<Answer>> logs = new HashMap<String, List<Answer>>();

	UnionTaxonomy() {
		this.tag = "union";
	}

	UnionTaxonomy(SourceTaxonomy source) {
		this.tag = "union";
		this.mergeIn(source);
		Node.windyp = true; //kludge
	}

	UnionTaxonomy promote() {
		return this;
	}

	void mergeIn(SourceTaxonomy source) {
		source.which = this.sources.size();
		source.mapInto(this, Criterion.criteria);
		source.augment(this);
		source.copySynonyms(this);
	}

	// Assign ids, harvested from idsource and new ones as needed, to nodes in union.

	void assignIds(SourceTaxonomy idsource) {
		this.idsource = idsource;
		idsource.which = this.sources.size();
		idsource.mapInto(this, Criterion.idCriteria);

		Node.resetStats();
		System.out.println("--- Assigning ids to union starting with " + idsource.getTag() + " ---");

		// Phase 1: recycle previously assigned ids.
		for (Node node : idsource) { // node is in the idsource taxonomy
			Node unode = node.mapped;
			Answer answer;
			if (unode != null) {
				if (unode.comapped != node)
					System.err.println("Map/comap don't commute: " + node + " " + unode);
				answer = assessSource(node, unode);
				if (answer.value >= Answer.DUNNO)
					Node.markEvent("keeping-id");
				else
					this.logAndMark(answer);
				unode.setId(node.id);
			}
		}

		// Phase 2: give new ids to union nodes that didn't get them above.
		long maxid = this.maxid();
		long sourcemax = idsource.maxid();
		if (sourcemax > maxid) maxid = sourcemax;
		System.out.println("| Highest id before: " + maxid);
		for (Node node : this)	 // this = union, idsource = ottol
			if (node.id == null) {
				node.setId(Long.toString(++maxid));
				node.addComment("new");
				node.markEvent("new-id");
			}

		Node.printStats();		// Taxon id clash

		System.out.println("| Highest id after: " + maxid);
	}

	// Cf. assignIds()
	// x is a source node drawn from the idsource taxonomy file.
	// y is the union node it might or might not map to.

	static Answer assessSource(Node x, Node y) {
		QualifiedId ref = x.putativeSourceRef();
		if (ref != null) {
			String putativeSourceTag = ref.prefix;
			String putativeId = ref.id;

			// Find source node in putative source taxonomy, if any
			QualifiedId sourceThere = null;
			// Every union node should have at least one source node
			// ... except those added through the patch facility ...
			// FIX ME
			if (y.sourceIds == null) return Answer.NOINFO;    //won't happen?
			for (QualifiedId source : y.sourceIds)
				if (source.prefix.equals(putativeSourceTag)) {
					sourceThere = source;
					break;
				}

			if (sourceThere == null)
				return Answer.no(x, y, "note/different-source",
								 ref
								 + "->" +
								 y.getSourceIdsString());
			if (!putativeId.equals(sourceThere.id))
				return Answer.no(x, y, "note/different-source-id",
								 ref
								 + "->" +
								 sourceThere.toString());
			else
				return Answer.NOINFO;
		} else
			return Answer.NOINFO;
	}

	void dumpDeprecated(SourceTaxonomy idsource, String filename) throws IOException {
		PrintStream out = Taxonomy.openw(filename);
		out.println("id\tname\tsourceinfo\treason\twitness\treplacement");
		for (Node node : idsource.idIndex.values())
			if (node.mapped == null) {
				Answer answer = node.deprecationReason;
				// assert answer.x == node
				if (answer != null)
					out.println(node.id
								+ "\t" +
								node.name
								+ "\t" +
								node.getSourceIdsString()
								+ "\t" +
								answer.reason
								+ "\t" +
								(answer.witness == null ? "" : answer.witness)
								+ "\t" +
								((answer.y != null &&
								  answer.value > Answer.DUNNO) ?
								 answer.y.id :
								 "*")
								);
				else
					out.println(node.id
								+ "\t" +
								node.name
								+ "\t" +
								node.getSourceIdsString()
								+ "\t" +
								"?"
								+ "\t" +
								""
								+ "\t" +
								"*");
			}
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
		Set<String> seen = new HashSet<String>();
		for (Node idnode : idsource) 
			if (idnode.mapped != null) {
				String idstringfield = idnode.auxids;
				if (idstringfield.length() == 0) continue;
				for (String idstring : idstringfield.split(",")) {
					Node auxnode = aux.idIndex.get(idstring);
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
					seen.add(idstring);
				}
			}
		
		for (Node auxnode : aux) {
			if (auxnode.mapped != null && !seen.contains(auxnode.id))
				out.print("" + auxnode.id
						  + "\t" +
						  // Can be invoked in either of two ways... see Makefile
						  (auxnode.mapped.id != null?
						   auxnode.mapped.id :
						   auxnode.mapped.getSourceIdsString())
						  + "\t" +
						  "new" + "\n");
			Node.markEvent("new-aux-mapping");
		}
		Node.printStats();
		out.close();
	}

    // Method on union taxonomy.
    void dumpAuxIds(String outprefix) throws java.io.IOException {
        // TBD: Should be done as a separate operation
		if (this.auxsource != null)
			this.explainAuxIds(this.auxsource,
							   this.idsource,
							   outprefix + "aux.tsv");
    }

	static Pattern tabPattern = Pattern.compile("\t");

	// Apply a set of edits to the union taxonomy

	void edit(String dirname) throws IOException {
		File[] editfiles = new File(dirname).listFiles();
        if (editfiles == null) {
            System.err.println("No edit files in " + dirname);
            return;
        }
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
			System.err.println("(add) Parent name " + parentName
							   + " not found in context " + contextName);
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
		if (existing != null) {
			existing = filterByContext(existing, contextName);
			if (existing != null && existing.size() > 1) {
				System.err.println("(move) Ambiguous taxon name: " + name);
				return;
			}
		}

		if (command.equals("add")) {
			if (existing != null) {
				System.err.println("(add) Warning: taxon already present: " + name);
				boolean winp = false;
				Node oldparent = null;
				for (Node node : existing)
					if (node.parent == parent) winp = true;
					else oldparent = node.parent;
				if (!winp)
					System.err.println("(add)  ... with a different parent: " +
									   oldparent.name + " not " + parentName);
			} else {
				Node node = new Node(this);
				node.setName(name);
				node.rank = rank;
				node.setSourceIds(sourceInfo);
				parent.addChild(node);
				node.properFlags |= Taxonomy.EDITED;
			}
		} else if (command.equals("move")) {
			if (existing == null)
				System.err.println("(move) No taxon to move: " + name);
			else {
				Node node = existing.get(0);
				if (node.parent == parent)
					System.err.println("(move) Note: already in the right place: " + name);
				else {
					// TBD: CYCLE PREVENTION!
					node.changeParent(parent);
					node.properFlags |= Taxonomy.EDITED;
				}
			}
		} else if (command.equals("prune")) {
			if (existing == null)
				System.err.println("(prune) No taxon to prune: " + name);
			else
				existing.get(0).prune();

		} else if (command.equals("flag")) {
			if (existing == null)
				System.err.println("(move) No taxon to flag: " + name);
			else {
				Node node = existing.get(0);
				node.properFlags |= Taxonomy.FLAGGED;
			}
		} else if (command.equals("synonym")) {
			// TBD: error checking
			List<Node> nodes = this.nameIndex.get(name);
			if (nodes == null) {
				nodes = new ArrayList<Node>(1);
				this.nameIndex.put(name, nodes);
			}
			if (nodes.contains(parent))
				System.err.println("Synonym already known: " + name);
			else
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
		this.dumpLog(outprefix + "log.tsv");
		this.dump(this.roots, outprefix + "taxonomy.tsv");
		this.dumpSynonyms(outprefix + "synonyms.tsv");
		if (this.idsource != null)
			this.dumpDeprecated(this.idsource, outprefix + "deprecated.tsv");
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

		for (List<Answer> answers : this.logs.values()) {
			boolean interestingp = false;
			for (Answer answer : answers)
				if (answer.isInteresting()) {interestingp = true; break;}
			if (interestingp)
				for (Answer answer : answers)
					out.println(answer.dump());
		}

		if (false) {
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
		}

		out.close();
	}

	// this is a union taxonomy ...

	void log(Answer answer) {
		String name = null;
		if (answer.y != null) name = answer.y.name;
		if (name == null && answer.x != null) name = answer.x.name;	 //could be synonym
		if (name == null) return;					 // Hmmph.  No name to log it under.
		List<Answer> lg = this.logs.get(name);
		if (lg == null) {
            // Kludge! Why not other names as well?
			if (name.equals("environmental samples")) return; //3606 cohomonyms
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
	String id = null;
	Node parent = null;
	String name, rank = null;
	List<Node> children = null;
	Taxonomy taxonomy;			// For subsumption checks etc.
	String auxids = null;		// preottol id from taxonomy file, if any
	int size = -1;
	List<QualifiedId> sourceIds = null;
	Answer deprecationReason = null;
	Answer blockedp = null;

	int properFlags = 0, inheritedFlags = 0, rankAsInt = 0;

	// State during merge operation
	Node mapped = null;			// source node -> union node
	Node comapped = null;		// union node -> source node
	boolean novelp = false;     // added to union in last round?
	private String division = null;

	static boolean windyp = true;

	Node(Taxonomy tax) {
		this.taxonomy = tax;
		this.novelp = true;
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
		if (parts.length >= 4) {
			this.rank = parts[3];
			if (this.rank.length() == 0) this.rank = "no rank";
			if (Taxonomy.ranks.get(this.rank) == null)
				System.err.println("!! Unrecognized rank: " + this.rank + " " + this.id);
		}
		// TBD: map source+sourceId when present (deprecated),
		// parse sourceInfo when present

		if (this.taxonomy.infocolumn != null) {
			if (parts.length <= this.taxonomy.infocolumn)
				System.err.println("Missing sourceinfo column: " + this.id);
			else {
				String info = parts[this.taxonomy.infocolumn];
				if (info != null && info.length() > 0)
					this.setSourceIds(info);
			}
		}

		else if (this.taxonomy.sourcecolumn != null &&
			this.taxonomy.sourceidcolumn != null) {
			List<QualifiedId> qids = new ArrayList<QualifiedId>(1);
			qids.add(new QualifiedId(parts[this.taxonomy.sourcecolumn],
									 parts[this.taxonomy.sourceidcolumn]));
		}

		if (this.taxonomy.preottolcolumn != null)
			this.auxids = parts[this.taxonomy.preottolcolumn];

	}

	static Pattern commaPattern = Pattern.compile(",");

	void setSourceIds(String info) {
		if (info.equals("null")) return;    // glitch in OTT 2.2
		String[] ids = commaPattern.split(info);
		if (ids.length > 0) {
			this.sourceIds = new ArrayList(ids.length);
			for (String qid : ids)
				this.sourceIds.add(new QualifiedId(qid));
		}
	}

	void setName(String name) {
		if (this.name != null)
			System.err.println("Already named: " + name + " -> " + this.name);
		this.name = name;
		if (name == null)
			System.err.println("! Setting name to null? " + this);
		else
			this.taxonomy.addToIndex(this);
	}

	void setId(String id) {
		if (this.id == null) {
			this.id = id;
			this.taxonomy.idIndex.put(id, this);
		} else
			System.err.println("Attempt to replace id " + this.id + " with " + id);
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
		} else if (child == this) {
			if (this.report("Attempt to create self-loop !!??", child))
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

	// Note: There can be multiple sources, separated by commas.
	// However, the first one in the list is the original source.
	// The others are merely inferred to be identical.

	QualifiedId putativeSourceRef() {
		if (this.sourceIds != null)
			return this.sourceIds.get(0);
		else
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
		if (unode.rank == null || unode.rank.equals("no rank"))
			unode.rank = this.rank; // !?
		unode.comapped = this;

		if (this.comment != null) { // cf. deprecate()
			unode.addComment(this.comment);
			this.comment = null;
		}
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

	void addSource(Node source) {
		// Temporarily maintain the two lists in parallel
		if (this.sourceIds == null)
			this.sourceIds = new ArrayList<QualifiedId>(1);
		this.sourceIds.add(source.getQualifiedId());
		// Accumulate ...
		if (source.sourceIds != null)
			for (QualifiedId qid : source.sourceIds)
				if (!this.sourceIds.contains(qid))
					this.sourceIds.add(qid);
	}

	QualifiedId getQualifiedId() {
		if (this.id != null)
			return new QualifiedId(this.taxonomy.getTag(), this.id);
		else {
			System.err.println("! Union nodes don't have qualified ids: " + this);
			return null;
		}
	}

	// Method on Node, called for every node in the source taxonomy
	Node augment(UnionTaxonomy union) {

		Node newnode = null;

		if (this.children == null) {
			if (this.mapped != null) {
				newnode = this.mapped;
				Node.markEvent("mapped/tip");
			} else if (this.deprecationReason != null &&
					   // Create homonym iff it's an unquestionably bad match
					   this.deprecationReason.value > Answer.HECK_NO) {
				union.logAndMark(Answer.no(this, null, "blocked/tip", null));
			} else {
				newnode = new Node(union);
				// heckYes is uninteresting
				union.logAndMark(Answer.heckYes(this, newnode, "new/tip", null));
			}
		} else {

			// The children fall into four classes
			//	A. Those that map to the "right" place (e.g. 'winner')
			//	B. Those that map to the "wrong" place (e.g. 'loser')
			//	C. Those that don't map - new additions to the union tree
			//  D. Those that get dropped for some reason ('mooted')
			// oldChildren includes both A and B
			// newChildren = C
			// The affinities of those in C might be divided between A and B...
			// thus if B is nonempty (there is a 'loser') class C is called
			// 'ambiguous'

			List<Node> oldChildren = new ArrayList<Node>();  //parent != null
			List<Node> newChildren = new ArrayList<Node>();  //parent == null
			// Recursion step
			for (Node child: this.children) {
				Node augChild = child.augment(union);
				if (augChild != null) {
					if (augChild.parent == null)
						newChildren.add(augChild);
					else
						oldChildren.add(augChild);
				}
			}

			if (this.mapped != null) {
				for (Node augChild : newChildren)
					// *** This is where the Protozoa/Chromista trouble arises. ***
					// *** They are imported, then set as children of 'life'. ***
					this.mapped.addChild(augChild);
				this.reportOnMapping(union, (newChildren.size() == 0));
				newnode = this.mapped;

			} else if (oldChildren.size() == 0) {
				// New children only... just copying new stuff to union
				if (newChildren.size() > 0) {
					newnode = new Node(union);
					for (Node augChild: newChildren)
						newnode.addChild(augChild);    // ????
					union.logAndMark(Answer.heckYes(this, newnode, "new/internal", null));
				} else
					union.logAndMark(Answer.no(this, null, "lose/mooted", null));
				// fall through

			} else if (this.refinementp(oldChildren, newChildren)) {

					// Move the new internal node over to union taxonomy.
					// It will end up becoming a descendent of oldParent.
					newnode = new Node(union);
					for (Node nu : newChildren) newnode.addChild(nu);
					for (Node old : oldChildren) old.changeParent(newnode);   // Detach!!
					// 'yes' is interesting, 'heckYes' isn't
					union.logAndMark(Answer.yes(this, null, "new/insertion", null));
					// fall through

			} else if (newChildren.size() > 0) {
				// Paraphyletic.
				// Leave the old children where they are.
				// Put the new children in a "tattered" incertae-sedis-like container.
				newnode = new Node(union);
				for (Node augChild: newChildren)
					newnode.addChild(augChild);

				newnode.properFlags |= Taxonomy.TATTERED;
				union.logAndMark(Answer.yes(this, null, "new/tattered", null));
				// fall through

			} else if (false && newChildren.size() == 0) {   // && oldChildren.size() == 0 ?
				// If there are oldchildren and so on, we have an insertion opportunity (Silva??)
				if (this.deprecationReason != null &&
					this.deprecationReason.value > Answer.HECK_NO)
					union.logAndMark(Answer.no(this, null, "blocked/internal", null));
				else
					union.logAndMark(Answer.no(this, null, "lose/mooted2", null));

			} else {
				// >= 1 old children, 0 new children
				// something funny's happening here... maybe the parent should be marked incertae sedis??
				union.logAndMark(Answer.no(this, null, "lose/dispersed", null));
			}
		}

		if (newnode != null) {
			if (this.mapped == null) {

				// Report on homonymy.
				// Either this is a name not before occurring in the union,
				//	 or the corresponding node(s) in union has been rejected
				//	 as a match.
				// Do this check before the unifyWith call, for prettier diagnostics.
				List<Node> losers = union.lookup(this.name);
				if (losers != null && losers.size() >= 1) {
					Node loser = losers.get(0);
					if (this.getDivision() == loser.getDivision())   //double check
						union.logAndMark(Answer.no(this, loser, "new-homonym/in-division", null));
					else
						union.logAndMark(Answer.no(this, loser, "new-homonym/out-division", null));
				}
				this.unifyWith(newnode);	   // sets name
			} else if (this.mapped != newnode)
				System.out.println("Whazza? " + this + " ... " + newnode);
			newnode.addSource(this);
		}

		return newnode;						 // = this.mapped
	}

	// If all of the old children have the same parent,
	// AND that parent is the nearest old ancestor of all the new children,
	// then we can add the old children to the new taxon,
	// which (if all goes well) will get inserted back into the union tree
	// under the old parent.

	// This is a cheat because some of the old children's siblings
	// might be more correctly classified as belonging to the new
	// taxon, rather than being siblings.  So we might want to
	// further qualify this.  (Rule is essential for mapping NCBI
	// onto Silva.)

	// Caution: See https://github.com/OpenTreeOfLife/opentree/issues/73 ...
	// family as child of subfamily is confusing.
	// ranks.get(node1.rank) <= ranks.get(node2.rank) ....

	boolean refinementp(List<Node> oldChildren, List<Node> newChildren) {
		Node oldParent = null;
		for (Node old : oldChildren) {
			// old has a nonnull parent, by contruction
			if (oldParent == null) oldParent = old.parent;
			else if (old.parent != oldParent) return false;
		}
		for (Node nu : newChildren) {
			// alternatively, could do some kind of MRCA
			Node anc = this.parent;
			while (anc != null && anc.mapped == null)
				anc = anc.parent;
			if (anc == null)     // ran past root of tree
				return false;
			else if (anc.mapped != oldParent)
				return false;    	// Paraphyletic
		}
		return true;
	}

	// pulled out of previous method to make it easier to read
	void reportOnMapping(UnionTaxonomy union, boolean newp) {
		Node newnode = null;

		// --- Classify & report on what has just happened ---
		// TBD: Maybe decorate the newChildren with info about the match?...
		Node loser = this.antiwitness(this.mapped);
		Node winner = this.witness(this.mapped);
		if (winner != null) {
			// Evidence of sameness [maybe parent agreement, or not]
			if (loser == null)
				// No evidence of differentness
				// cf. "is-subsumed-by" - compatible extension
				// (35,351)
				// heckYes = uninteresting
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
			// No evidence of sameness [except maybe parent agreement]
			if (loser == null) {
				if (newp)
					Node.markEvent("mapped/internal"); // Exact topology match
				else
					// No evidence of differentness
					// cf. "by-elimination" - could actually be a homonym
					// (7,093 occurrences, as of 2013-04-24, of which 571 'essential')
					// (all but 94 of which have shared parents...)
					union.logAndMark(Answer.noinfo(this, newnode, "mapped/neutral", null));
			} else
				// Evidence of differentness
				// This case is rare, because it's ruled out in
				// Criterion.subsumption, cf. "incompatible-with" ("type 2")
				// (52 times, as of 2013-04-24, + 13 unmapped)
				// Still arises when agreement on parent
				union.logAndMark(Answer.no(this, newnode, "mapped/incompatible", null));
		}
		// --- End classify & report ---
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
		QualifiedId ref = this.putativeSourceRef();
		if (ref != null)		// this is from idsource
			ids = this.id + "=" + ref;
		else {
			ids = this.getSourceIdsString();
			if (ids.length() == 0)
				ids = this.getQualifiedId().toString();
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

	String getSourceIdsString() {
		String answer = null;
		List<QualifiedId> qids = this.sourceIds;
		if (qids != null) {
			for (QualifiedId qid : qids) {
				if (answer == null)
					answer = qid.toString();
				else
					answer = answer + "," + qid.toString();
			}
		}
		// else answer = getQualifiedId().toString() ... ?
		if (answer != null)
			return answer;
		else
			// callers expect non-null
			return "";
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
		while (up != null && up.name != null && this.name.startsWith(up.name))
			up = up.parent;

		while (up != null && up.name != null && other.lookup(up.name) == null)
			up = up.parent;

		if (up != null && up.name == null) {
			System.err.println("!? Null name: " + up + " ancestor of " + this);
			Node u = this;
			while (u != null) {
				System.err.println(u);
				u = u.parent;
			}
		}
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
			buf.append(name.replace('(','[').replace(')',']').replace(':','?'));
	}

	static Comparator<Node> compareNodes = new Comparator<Node>() {
		public int compare(Node x, Node y) {
			return x.name.compareTo(y.name);
		}
	};

	// Delete this node and all of its descendents.
	void prune() {
		if (this.children != null) {
			for (Node child : new ArrayList<Node>(children))
				child.prune();
			this.children = null;
		}
		if (this.parent != null) {
			this.parent.children.remove(this);
			this.parent = null;
		}
		List nodes = this.taxonomy.nameIndex.get(this.name);
		nodes.remove(this);
		if (nodes.size() == 0)
			this.taxonomy.nameIndex.remove(this.name);
		this.properFlags |= Taxonomy.EDITED;
	}

	String uniqueName() {
		List<Node> nodes = this.taxonomy.lookup(this.name);
		if (nodes == null) return "";

		boolean difficultp = false;
		if (this.name.indexOf(" sp.") >= 0)
			difficultp = true;

		if (!difficultp && nodes.size() < 2) return "";

		// Homonym
		Node i = this.informative();

		if (i != null && !difficultp)
			for (Node other : nodes)
				if (other != this) {
					Node j = other.informative();
					if (i == j) {
						difficultp = true;
						break;
					}
				}
		if (i != null && !difficultp) {
			String urank = "";
			if (!this.rank.equals("no rank")) urank = this.rank + " ";
			String irank = "";
			if (!i.rank.equals("no rank")) irank = i.rank + " ";
			return this.name + " (" + urank + "in " + irank + i.name + ")";
		} else
			return this.name + " (" + this.getSourceIdsString() + ")";
	}

}

// Consider all possible assignments

class Matrix {

	String name;
	List<Node> nodes;
	List<Node> unodes;
	int m;
	int n;
	Answer[][] suppressp;

	Matrix(String name, List<Node> nodes, List<Node> unodes) {
		this.name = name;
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

		// Log the fact that there are synonyms involved in these comparisons
		if (false)
			for (Node node : nodes)
				if (!node.name.equals(name)) {
					Node unode = unodes.get(0);
					((UnionTaxonomy)unode.taxonomy).logAndMark(Answer.noinfo(node, unode, "synonym(s)", node.name));
					break;
				}

		for (Criterion criterion : criteria)
			run(criterion);

		// see if any source node remains unassigned (ties or blockage)
		postmortem();
		suppressp = null;  //GC
	}

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
				if (z.value == Answer.DUNNO)
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
		for (int i = 0; i < m; ++i) // iterate over source nodes
			// Don't assign a single source node to two union nodes...
			if (uniq[i] >= 0) {
				int j = uniq[i];
				// Avoid assigning two source nodes to the same union node (synonym creation)...
				if (uuniq[j] >= 0 && suppressp[i][j] == null) {
					Node x = nodes.get(i); // == uuniq[j]
					Node y = unodes.get(j);

					// Block out column, to prevent other source nodes from mapping to the same union node
					for (int ii = 0; ii < m; ++ii)
						if (ii != i && suppressp[ii][j] == null)
							suppressp[ii][j] = Answer.no(nodes.get(ii), y, "excluded", x.getQualifiedId().toString());
					// Block out row, to prevent this source node from mapping to multiple union nodes (!!??)
					for (int jj = 0; jj < n; ++jj)
						if (jj != j && suppressp[i][jj] == null)
							suppressp[i][jj] = Answer.no(x, unodes.get(jj), "coexcluded", null);

					Answer a = answer[i];
					if (x.mapped == y)
						;
					else if (y.comapped != null) {
						x.deprecationReason = a;
						a = Answer.no(x, y, "lost-race-to-union",
									  "lost to " +
									  y.comapped.getQualifiedId().toString());
					} else if (x.mapped != null) {
						x.deprecationReason = a;
						a = Answer.no(x, y, "lost-race-to-source",
									  (y.getSourceIdsString() + " lost to " +
									   x.mapped.getSourceIdsString()));
					} else
						x.unifyWith(y);
					suppressp[i][j] = a;
				}
			}
	}

	// in x[i][j] i specifies the row and j specifies the column

	// Record reasons for failure - for each unmapped source node, why didn't it map?
	void postmortem() {
		for (int i = 0; i < m; ++i) {
			Node node = nodes.get(i);
			// Suppress synonyms
			if (node.mapped == null) {
				// The explanation lies (mostly) in suppressp[i]
				int alts = 0;
				for (int j = 0; j < n; ++j)
					if (suppressp[i][j] == null) ++alts;
				UnionTaxonomy union = (UnionTaxonomy)unodes.get(0).taxonomy;
				Answer explanation;
				if (alts == 1)
					// There must be multiple source nodes competing
					// for this one union node.
					explanation = Answer.noinfo(node, null, "unresolved/contentious", null);
				else if (alts > 1)
					// Multiple union nodes to which this source can map... no way to tell
					explanation = Answer.noinfo(node, null, "unresolved/ambiguous", null);
				else {
					// Important case, mapping blocked, give gory details
					if (n == 1)
						explanation = suppressp[i][0];
					else {
						for (int j = 0; j < n; ++j)
							union.log(suppressp[i][j]);
						String kludge = null;
						int badness = -100;
						for (int j = 0; j < n; ++j) {
							if (suppressp[i][j].value > badness)
								badness = suppressp[i][j].value;
							if (kludge == null)
								kludge = suppressp[i][j].reason;
							else if (j < 5)
								kludge = kludge + "," + suppressp[i][j].reason;
							else if (j == 5)
								kludge = kludge + ",...";
						}
						explanation = new Answer(node, null, badness, "unresolved/blocked", kludge);
					}
				}
				union.logAndMark(explanation);
				// remember, this could be either gbif or idsource
				if (node.deprecationReason == null)
					node.deprecationReason = explanation;  
			}
		}
	}
}

// Assess a criterion for judging whether x <= y or not x <= y
// Positive means yes, negative no, zero I couldn't tell you
// x is source node, y is union node

abstract class Criterion {

	abstract Answer assess(Node x, Node y);

	// DOESN'T WORK.

	// Ciliophora = ncbi:5878 = gbif:10 != gbif:3269382
	static QualifiedId[][] exceptions = {
		{new QualifiedId("ncbi","5878"),
		 new QualifiedId("gbif","10"),
		 new QualifiedId("gbif","3269382")},	// Ciliophora
		{new QualifiedId("ncbi","29178"),
		 new QualifiedId("gbif","389"),
		 new QualifiedId("gbif","4983431")}};	// Foraminifera

	// This is obviously a horrible kludge, awaiting a rewrite
	// Foraminifera seems to have been fixed somehow
	static Criterion adHoc =
		new Criterion() {
			Answer assess(Node x, Node y) {
				for (QualifiedId[] exception : exceptions) {
					// x is from gbif, y is union
					String xtag = x.taxonomy.getTag();
					if (xtag.equals(exception[1].prefix) &&
						x.id.equals(exception[1].id)) {
						System.out.println("| Trying ad-hoc match rule: " + x);
						if (y.sourceIds.contains(exception[0]))
							return Answer.yes(x, y, "ad-hoc", null);
					} else if (xtag.equals(exception[2].prefix) &&
							   x.id.equals(exception[2].id)) {
						System.out.println("| Trying ad-hoc mismatch rule: " + x);
						return Answer.no(x, y, "ad-hoc-not", null);
					}
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
				if (x0 == null || y0 == null)
					return Answer.NOINFO;

				if (x0.name == null)
					System.err.println("! No name? 1 " + x0 + "..." + y0);
				if (y0.name == null)
					System.err.println("! No name? 2 " + x0 + "..." + y0);

				if (x0.name.equals(y0.name))
					return Answer.heckYes(x, y, "same-parent/direct", x0.name);
				else if (online(x0.name, y0))
					// differentiating the two levels
					// helps to deal with the Nitrospira situation (7 instances)
					return Answer.heckYes(x, y, "same-parent/extended-l", x0.name);
				else if (online(y0.name, x0))
					return Answer.heckYes(x, y, "same-parent/extended-r", y0.name);
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

	// Match NCBI or GBIF identifiers
	// This kicks in when we try to map the previous OTT to assign ids, after we've mapped GBIF.
	// x is a node in the old OTT.  y, the union node, is in the new OTT.
	static Criterion compareSourceIds =
		new Criterion() {
			Answer assess(Node x, Node y) {
				// x is source node, y is union node.
				// compare x.id to y.sourcenode.id
				// Try assessSource here !?
				if (x.sourceIds != null)
					for (QualifiedId oldsource : x.sourceIds)
						for (QualifiedId newsource : y.sourceIds)
							if (oldsource.prefix.equals(newsource.prefix)) {
								if (oldsource.equals(newsource))
									return Answer.yes(x, y, "same-qualified-id", null);
								else
									; //return Answer.no(x, y, "different-qualified-id", null);
							}
				return Answer.NOINFO;
			}
		};

	// E.g. Paraphelenchus
	static Criterion elimination =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (!x.name.equals(y.name))
					// Evidence of difference, but not good enough to overturn synonymy evidence
					return Answer.weakYes(x, y, "by-elimination/different-names", y.name);
				else if (!x.rank.equals(y.rank))
					// Evidence of difference, but not good enough to overturn name evidence
					return Answer.weakYes(x, y, "by-elimination/different-ranks", x.rank + "/" + y.rank);
				else if (x.children != null && y.children != null)
					return Answer.weakYes(x, y, "by-elimination/internal", null);
				else
					return Answer.heckYes(x, y, "by-elimination/tip", null);
			}
		};

	static Criterion[] criteria = { adHoc, division, lineage, subsumption, compareSourceIds, elimination };

	static Criterion[] idCriteria = { adHoc, division, lineage, subsumption, compareSourceIds, elimination };

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
	int value;					// YES, NO, etc.
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

			 (this.x != null ? this.x.getQualifiedId().toString() : "?") + "\t" +

			 (this.value > DUNNO ?
			  "yes" :
			  (this.value < DUNNO ? "no" : "-")) + "\t" +

			 this.reason + "\t" +

			 (this.y == null ? "?" : this.y.id) + "\t" +

			 (this.witness == null ? "" : this.witness) );
	}

	// How many taxa would we lose if we didn't import this part of the tree?
	int lossage(Node node) {
		int n = 1;
		if (node.children != null)
			for (Node child : node.children)
				if (child.mapped == null || child.mapped.novelp)
					n += lossage(child);
		return n;
	}
}

class QualifiedId {
	String prefix;
	String id;
	QualifiedId(String prefix, String id) {
		this.prefix = prefix; this.id = id;
	}
	QualifiedId(String qid) {
		String[] foo = qid.split(":", 2);
		if (foo.length != 2)
			throw new RuntimeException("ill-formed qualified id: " + qid);
		this.prefix = foo[0]; this.id = foo[1];
	}
	public String toString() {
		return prefix + ":" + id;
	}
	public boolean equals(Object o) {
		if (o instanceof QualifiedId) {
			QualifiedId qid = (QualifiedId)o;
			return (qid.id.equals(id) &&
					qid.prefix.equals(prefix));
		}
		return false;
	}
}



/*
  -----

  Following are notes collected just before this program was written.
  They are no longer current.

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
