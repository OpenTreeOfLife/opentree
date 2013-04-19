/*

  JAR's taxonomy combiner.

  WORK IN PROGRESS... I'll split into multiple files when I'm ready to
  do so; currently it's much easier to work with in this form.


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
   ~/a/NESCent/ottol/preottol-20121112.processed

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
import java.util.Iterator;
import java.util.Comparator;
import java.util.Collections;
import java.util.Collection;
import java.io.PrintStream;

public class Smasher {

	public static void main(String argv[]) throws Exception {

		if (argv.length > 0) {

			UnionTaxonomy union = new UnionTaxonomy();
			boolean anyfile = false;
			Node.windyp = false;
			SourceTaxonomy idsource = null;

			for (int i = 0; i < argv.length; ++i) {

				if (argv[i].startsWith("--")) {

					if (argv[i].equals("--ids")) {
						idsource = getTaxonomy(argv[++i]);
						union.assignIds(idsource);
					}

					else if (argv[i].equals("--aux")) // preottol
						union.checkAuxIds(getTaxonomy(argv[++i]), idsource);

					else if (argv[i].equals("--dump"))
						union.dump(argv[++i]);

					else if (argv[i].equals("--log")) {
						if (++i < argv.length)
							union.dumpLog(argv[i]);
						else
							System.err.println("Missing file name for --log");

					} else if (argv[i].equals("--test"))
						test();

					else if (argv[i].equals("--newick"))
						System.out.println(" -> " + union.toNewick());

					else System.err.println("Unrecognized directive: " + argv[i]);
				}

				else {
					union.mergeIn(getTaxonomy(argv[i]));
					Node.windyp = true;
				}
			}
			union.finish();
		}
	}

	static SourceTaxonomy getTaxonomy(String designator) throws IOException {
		SourceTaxonomy taxo;
		if (designator.startsWith("("))
			taxo = SourceTaxonomy.parseNewick(designator);
		else
			taxo = SourceTaxonomy.readTaxonomy(designator);
		return taxo;
	}

	static void test() {

		Taxonomy tax = SourceTaxonomy.parseNewick("(a,b,(e,f)c)d");
		for (Node node : tax)
			System.out.println(node);
	}
}

class Taxonomy implements Iterable<Node> {
	Map<String, ArrayList<Node>> nameIndex = new HashMap<String, ArrayList<Node>>();
	Map<Long, Node> idIndex = new HashMap<Long, Node>();
	List<Node> allnodes = new ArrayList<Node>();
	Node root;
	int which = -1;
	long maxid = -1;
	protected String tag = null;
	static Long fakeIdCounter = -1L;
	int nextSequenceNumber = 0;

	Taxonomy() { }

	public String toString() {
		return "(taxonomy " + (tag != null ? tag : "?") + ")";
	}

	Node getRoot() {
		return root;
	}

	ArrayList<Node> lookup(String name) {
		return this.nameIndex.get(name);
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
		ArrayList<Node> nodes = this.nameIndex.get(name);
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
			else if (id == 395048) this.tag = "ot";
			else if (id == 100968828) this.tag = "preottol";
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

	// Render this taxonomy as a Newick string

	String toNewick() {
		StringBuffer buf = new StringBuffer();
		if (this.root != null)
			this.root.appendNewickTo(buf);
		return buf.toString();
	}

}

class SourceTaxonomy extends Taxonomy {

	SourceTaxonomy() {
	}

	void mapInto(UnionTaxonomy union, Criterion[] criteria) {
		// 0. Reset statistics counters, mapped, etc
		// 1. Map tips
		// 2. Map internal nodes
		// 3. Add previously unmapped tips and internal nodes

		union.sources.add(this);

		if (this.root != null) {

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
				List<Node> unodes = union.lookup(name);
				if (unodes != null) {
					++incommon;
					new Matrix(this.lookup(name), unodes).run(criteria);
				}
			}
			System.out.println("| Names in common: " + incommon);

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

			System.out.println(" Of " + total + " nodes in " + this.getTag() + ": " +
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
			{"Rhodophyta"},
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
				System.out.println("Copying from " + this.getTag() + " to union");
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
	
	String[] header = null;

	static Pattern p = Pattern.compile("\t\\|\t");

	public static SourceTaxonomy readTaxonomy(String filename) throws IOException {
		FileReader fr = new FileReader(filename);
		BufferedReader br = new BufferedReader(fr);
		String str;
		int row = 0;
		SourceTaxonomy tax = new SourceTaxonomy();
		Node root = null;

		while ((str = br.readLine()) != null) {
			String[] parts = p.split(str);
			if (parts.length < 3) {
				System.out.println("Bad row: " + row + " has " + parts.length + " parts");
			} else {
				// id | parentid | name | rank | ...
				try {
					Long id = new Long(parts[0]);
					Node node = tax.idIndex.get(id);
					if (node == null) {
						node = new Node(tax);
						node.setId(id); // stores into tax.idIndex
					}
					if (parts[1].length() > 0) {
						Long parentId = new Long(parts[1]);
						Node parent = tax.idIndex.get(parentId);
						if (parent == null) {
							parent = new Node(tax);	 //don't know parent's name yet
							parent.setId(parentId);
						}
						parent.addChild(node);
					} else if (root != null) {
						node.report("Multiple roots", root);
					} else
						root = node;
					node.init(parts); // sets name
				} catch (NumberFormatException e) {
					tax.header = parts; // Stow it just in case...
					continue;
				}
			}
			++row;
			if (row % 500000 == 0)
				System.out.println(row);
		}
		fr.close();

		if (root != null)
			tax.root = root;
		else
			System.err.println("*** No root node!");

		if (row != root.count())
			System.err.println(tax.getTag() + " is ill-formed: " +
							   row + " rows, " + 
							   root.count() + " reachable");

		tax.investigateHomonyms();
		return tax;
	}

	void investigateHomonyms() {
		int homs = 0;
		int sibhoms = 0;
		int cousinhoms = 0;
		for (ArrayList<Node> nodes : nameIndex.values())
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
			System.out.println(homs + " homonyms, " +
							   cousinhoms + " cousin pairs, " +
							   sibhoms + " sibling pairs");
		}
	}

	static SourceTaxonomy parseNewick(String newick) {
		SourceTaxonomy tax = new SourceTaxonomy();
		tax.root = tax.newickToNode(newick);
		return tax;
	}

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

}

class UnionTaxonomy extends Taxonomy {

	List<SourceTaxonomy> sources = new ArrayList<SourceTaxonomy>();
	SourceTaxonomy idsource = null;
	Map<String, List<Answer>> logs = new HashMap<String, List<Answer>>();

	UnionTaxonomy() {
		this.tag = "union";
	}

	void start() {
		Node.resetStats();
	}

	void mergeIn(SourceTaxonomy source) {
		start();
		source.which = this.sources.size();
		System.out.println("--- Merging " + source.getTag() + " ---");
		source.mapInto(this, Criterion.criteria);
		source.augment(this, true);
	}

	// Assign ids, harvested from idsource and new ones as needed, to nodes in union.

	void assignIds(SourceTaxonomy idsource) {
		start();
		this.idsource = idsource;
		idsource.which = this.sources.size();
		System.out.println("--- Carrying ids over from " + idsource.getTag() + " ---");
		idsource.mapInto(this, Criterion.idCriteria);

		// Any need to do the following any more?
		// idsource.augment(this, true);

		Node.resetStats();

        // Phase 1: recycle previously assigned ids.
		for (Node node : idsource) { // node is in the idsource
			Node unode = node.mapped;
			if (unode != null) {
                Answer answer = Criterion.source.assess(node, unode);
                if (answer.value < 0) {
                    ((UnionTaxonomy)unode.taxonomy).log(answer);
                    node.markEvent("deprecating/wrong-mapping");
                } else {
                    unode.setId(node.id);	//if (unode.id == Node.NO_ID) ;
                    node.markEvent("keeping-id");
                }
			} else
                node.markEvent("deprecating/not-mapped");
		}

		// Phase 2: give new ids to union nodes that didn't get them above.
		for (Node node : this)	 // this = union, idsource = ottol
			if (node.id < 0) {
				node.setId(++idsource.maxid);
				node.addComment("new");
                node.markEvent("new-id");
            }

		Node.printStats();		// Taxon id clash

		System.out.println(" Highest id: " + this.maxid);
		
		if (this.maxid < idsource.maxid)
			System.out.println(" *** NYI: the highest id is deprecated: " +
							   this.maxid + " < " + idsource.maxid);
	}

	// Copy ottol ids from old version (source) to new version (union)

	void copyIds(SourceTaxonomy idsource) {
	}

	void checkAuxIds(SourceTaxonomy aux, SourceTaxonomy idsource) {
		System.out.println("--- Checking ids from " + idsource.getTag() + " ---");
		System.err.println("NYI");
		aux.mapInto(this, Criterion.idCriteria);
	}

	void finish() {
		// Flag homonyms
		for (Node node: this) {	  // this = union
			List<Node> nodes = this.lookup(node.name);
			if (nodes != null && nodes.size() > 1)
				node.addComment("homonym"); // Do this only once, at the end
		}
	}

	void dump(String filename) throws IOException {
		PrintStream out = openw(filename);
		//Formerly:
		//out.println("uid\t|\tparent_uid\t|\tname\t|\trank\t|\tsource\t|\tsourceid\t|\tsourcepid\t|\t" +
		//			"uniqname\t|\tpreottol_id\t|\t");
		out.println("uid\t|\tparent_uid\t|\tname\t|\trank\t|\tsource\t|\tsourceid\t|\tcomment\t|\t" +
					// 0	  1				 2		   3	   4		 5			   6
					"uniqname\t|\tpreottol_id\t|\t"
					//	7			8
					);

		dumpNode(this.root, out);
		out.close();
	}

	void dumpNode(Node unode, PrintStream out) {
		// uid:
		out.print(unode.id + "\t|\t");
		// parent_uid:
		out.print((unode.parent == null ? "" : unode.parent.id)  + "\t|\t");
		// name:
		out.print((unode.name == null ? "?" : unode.name) + "\t|\t");
		// rank:
		out.print((unode.rank == null ? "" : unode.rank) + "\t|\t");

		// Source information
		{
			Node source = unode.origin();
			String tag = (source == null ? "-" : source.taxonomy.getTag());
			if (tag == null) tag = "?";
			// source:
			out.print(tag + "\t|\t");
			// sourceid:
			out.print((source == null ? "" : source.id) + "\t|\t");
			// sourcepid:
			// out.print((source == null || source.parent == null ? "" : source.parent.id) + "\t|\t");
		}

		// comment (was 'sourcepid')
		out.print(getComment(unode) + "\t|\t");

		// uniqname
		out.print(uniqueName(unode) + "\t|\t");

		// preottol_id
		if (idsource != null) {
			Node idnode = idsource.idIndex.get(unode.id);
			if (idnode != null && idnode.extra != null && idnode.extra.length >= 9)
				out.print(idnode.extra[8] + "\t|\t"); 
			else
				out.print("" + "\t|\t");
		} else	out.print("" + "\t|\t");
		out.println();

		if (unode.children != null)
			for (Node child : unode.children)
				dumpNode(child, out);
	}

	// What question should we try to answer?
	// "Why does this row say what it says"?
	// meaning: explain the parent link, ottol id, and sources.
	// Especially if there's homonymy involved.

	static String getComment(Node unode) {
		return (unode.comment != null? unode.comment : "");
	}

	static String uniqueName(Node unode) {
		List<Node> nodes = unode.taxonomy.lookup(unode.name);
		if (nodes == null || nodes.size() < 2)
			return "";
		else if (unode.parent != null && unode.parent.parent != null)
			return unode.name + " << " + unode.parent.name + " << " + unode.parent.parent.name;
		else {
			Node origin = unode.origin();
            if (origin != null)
                return unode.name + " == " + origin.getQualifiedId();
            else
                return unode.name + " NYI??"; // TBD !!!
		}
	}

	// 

	void dumpLog(String filename) throws IOException {
		PrintStream out = openw(filename);

		for (List<Answer> answers : this.logs.values()) {
			boolean interestingp = false;
			for (Answer answer : answers)
				if (answer.interestingp) {interestingp = true; break;}
			if (interestingp)
				for (Answer answer : answers)
					out.println(answer.dump());
		}

		out.close();
	}

	void dumpUnmappedInfo(Node node, PrintStream out) {
		// uid:
		out.print(node.id + "\t|\t");
		// Why didn't it map?
	}

	PrintStream openw(String filename) throws IOException {
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

	void log(Answer answer) {
		if (answer.x == null) return;
		List<Answer> lg = this.logs.get(answer.x.name);
		if (lg == null) {
			lg = new ArrayList<Answer>(1);
			this.logs.put(answer.x.name, lg);
		}
		lg.add(answer);
	}
    void logm(Answer answer) {
        this.log(answer);
        Node.markEvent(answer.reason);
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
	int size = -1;
	List<Node> sourcenodes = null;

	// State during merge operation
	Node mapped = null;			// source node -> union node
	Node comapped = null;		// union node -> source node
	boolean deprecatedp = false;
    boolean novelp = true;
	private String division = null;

	static boolean windyp = true;

	Node(Taxonomy tax) {
		this.taxonomy = tax;
		this.taxonomy.allnodes.add(this);
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

	// Nearest ancestor having a name that's not a prefix of ours
	Node informative() {
		Node up = this.parent;
		while (up != null && this.name.startsWith(up.name))
			up = up.parent;
		return up;
	}

	// If this is a node from the union taxonomy, return the
	// corresponding original source node (the one that created it)
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
			// Shouldn't happen - assigning to 2 different taxa (2 parents)
			//	(or blocked)
			if (this.report("Already assigned to node in union:", unode))
				Node.backtrace();
			return;
		}
		if (unode.comapped != null) {
			// Union node has already been matched to - this would create synonyms
			//	(or blocked)
			if (this.report("Union node already matched: ", unode))
				Node.backtrace();
			return;
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

	static int newinternal = 0;
	static int additions = 0;

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

		if (this.children == null) {
			if (this.mapped != null)
				return this.mapped;
			if (!retentivep) return null;
			newnode = new Node(union);
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
				if (this.mapped != null) return this.mapped;

				// Check for possible insertion event
				boolean sibs = true;
				Node mappedParent = null;
				for (Node child : this.children)
					if (mappedParent == null && child.mapped != null)
						mappedParent = child.mapped.parent;
					else if (child.mapped != null && mappedParent != child.mapped.parent)
						sibs = false;

				if (sibs &&
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
					union.logm(Answer.yes(this, newnode, "insertion", null));
					newnode.addComment("insertion", this);
					return newnode;
				} else {
					// Children all got sent away to other taxa.
                    // The old union id (if any) will become deprecated.
                    union.logm(Answer.no(this, null, "mooted", null));
					return null;
				}
			}

			// Split loyalties among the children?
			Node loser = (this.mapped != null) ? this.antiwitness(this.mapped) : null;

			// 4 cases to analyze: mapped / loser

			if (loser != null) {
				// Some children got sent away, some remain.
				// *** TaxonomyComparator throws these away.
				// This will create a homonym.
				if (!retentivep) return null;
				newnode = new Node(union);
				newnode.setName(this.name + " [maybe]");
				newnode.rank = this.rank;
				newnode.deprecatedp = true;
				for (Node child: newChildren) newnode.addChild(child);
				Node winner = (this.mapped != null) ? this.witness(this.mapped) : null;
				if (winner != null) {
					newnode.addComment("amb1(" + winner.name + "," + loser.name + ")");
					union.logm(Answer.yes(this, newnode, "ambiguous/type-1", winner.name));
				} else {
					newnode.addComment("amb2(" + loser.name + ")");
					union.logm(Answer.yes(this, newnode, "ambiguous/type-2", null));
				}
				return newnode;
			}

			// (winner == null && loser == null) 

			if (this.mapped != null) {
				for (Node augChild : newChildren) {
					this.mapped.addChild(augChild);
					++additions; markEvent("Graft");
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
				// All children are new, not previously matched
				// Compatible import of a subtree (new higher taxa)
				// Might create a homonym, but if so, it should
				newnode = new Node(union);
				for (Node child: newChildren)
					newnode.addChild(child);
				++newinternal; markEvent("New internal");
				// should match old if possible ??
				// fall through
			}
		}

		// Either this is a name not before occurring in the union,
		//	 or the corresponding node in union has been rejected
		//	 as a match.
		// Do this check before the unify() call, for prettier diagnostics.
		List<Node> losers = union.lookup(this.name);
		if (losers != null && losers.size() >= 1) {
			Node loser = losers.get(0);
			if (this.getDivision() == loser.getDivision()) {   //double check
				this.report("New homonym within division", loser);
				union.logm(Answer.yes(this, newnode, "new/homonym/in-division", null));
			} else {
				union.logm(Answer.yes(this, newnode, "new/homonym/out-division", null));
			} 
		} else
            union.logm(Answer.dull(this, newnode, "new", null));

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

		return 
			"(" + this.getVariousIds() +
			(this.children == null ? "." : "") +
			" " + this.name +
			twinkie +				// tbd: indicate division top with "#" 
			(this.comment != null ? (" " + this.comment) : "") +
			")";
	}

	// For debugging...
	String getVariousIds() {
		if (extra != null && extra.length >= 6) // idsource (previous ottol)
			return this.id + "=" + extra[4] + ":" + extra[5];
		String ids = null;
		if (sourcenodes != null) {	// union (updated ottol)
			for (Node source : sourcenodes)
				if (source != null) {
					String id = source.getQualifiedId();
					if (ids == null)
						ids = id;
					else
						ids = ids + "," + id;
				}
		}
		if (ids == null)
			return this.getQualifiedId();
		else
			return "{" + ids + "}";
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
		if (startReport(note)) {
			System.out.println(" | " + note);
			this.report1("", othernode);
			othernode.report1("", this);
			System.out.println();
			return true;
		}
		return false;
	}

	boolean report(String note, List<Node> others) {
		if (startReport(note)) {
			System.out.println(" |" + note);
			this.report1("", null);
			for (Node othernode : others)
				othernode.report1("", others.get(0));
			System.out.println();
			return true;
		}
		return false;
	}

	boolean report(String note, Node othernode, Node fred) {
		if (startReport(note)) {
			System.out.println(" |" + note);
			this.report1("", othernode);
			othernode.report1("", this);
			fred.report1("", this);
			System.out.println();
			return true;
		}
		return false;
	}

	void report() {
		report("");
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
		Node p = this.parent;
		while (p != null && other.lookup(p.name) == null)
			p = p.parent;
		return p;
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

	boolean[][] suppressp;
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
		suppressp = new boolean[m][];
		for (int i = 0; i < m; ++i)
			suppressp[i] = new boolean[n];
	}

	// Compare every node to every other node, according to a list of criteria.
	void run(Criterion[] criteria) {
		clear();
		run(Criterion.noSynonyms);
		for (Criterion criterion : criteria)
			run(criterion);
		// see if any source node remains unassigned (ties or blockage)
		observe();
	}

	// Returns true iff any remain unresolved at the end
	void run(Criterion criterion) {
		int m = nodes.size();
		int n = unodes.size();
		int[] high = new int[m];  for (int i=0; i<m; ++i) high[i]=-100;
		int[] uhigh = new int[n]; for (int j=0; j<n; ++j) uhigh[j]=-100;
		boolean[] uniq = new boolean[m];
		boolean[] uuniq = new boolean[n];
		int[] winner = new int[m];	 for (int i=0; i<m; ++i) winner[i]=-1;
		int[] uwinner = new int[n];	 for (int j=0; j<n; ++j) uwinner[j]=-1;
		Answer[][] answers = new Answer[m][];
		for (int i = 0; i < m; ++i)
			answers[i] = new Answer[n];

		for (int i = 0; i < m; ++i)
			for (int j = 0; j < n; ++j) {
				if (suppressp[i][j]) continue;
				Node x = nodes.get(i);
				Node y = unodes.get(j);
				Answer z = criterion.assess(x, y);
				if (z.value == 0)
					continue;
				((UnionTaxonomy)y.taxonomy).log(z);
				answers[i][j] = z;
				if (z.value < 0) {
					suppressp[i][j] = true;
					continue;
				}
				if (z.value > high[i]) {
					uniq[i] = true;
					high[i] = z.value;
				} else if (z.value == high[i])
					uniq[i] = false;

				if (z.value > uhigh[j]) {
					uuniq[j] = true;
					uhigh[j] = z.value;
					uwinner[j] = j;
				} else if (z.value == uhigh[j])
					uuniq[j] = false;
			}
		for (int i = 0; i < m; ++i)
			if (uniq[i] && (high[i] > 0))
				for (int j = n-1; j >= 0; --j) {
					if (!suppressp[i][j]) {
						if (uuniq[j] && (uhigh[j] > 0)) {
							Node x = nodes.get(i);
							Node y = unodes.get(j);
							x.unifyWith(y);
							Answer z = answers[i][j];
							if (z != null) {
								if (z.interestingp)
									y.addComment(z.reason, z.witness);
								y.markEvent(z.reason);
							} else {
								y.addComment("no-information");
								y.markEvent("no-information");
							}
							for (int ii = 0; ii < m; ++ii)
								suppressp[ii][j] = true;
							for (int jj = 0; jj < n; ++jj)
								suppressp[i][jj] = true;
						}
					}
				}
	}

	boolean observe() {
		boolean morep = false;
		for (int i = 0; i < m; ++i)
			if (nodes.get(i).mapped == null) {
				((UnionTaxonomy)unodes.get(0).taxonomy).log
					(Answer.noinfo(nodes.get(i), null, "unresolved"));
				morep = true;
				//for (int j = n-1; j >= 0; --j)
				// if (!suppressp[i][j]) ...
			}
		return morep;
	}
}

// Assess a criterion for judging whether x <= y or not x <= y
// Positive means yes, negative no, zero I couldn't tell you
// x is source node, y is union node

abstract class Criterion {

	abstract Answer assess(Node x, Node y);

	static Criterion noSynonyms =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (y.comapped != null)
					return (x == y.comapped) ? Answer.YES : Answer.NO;
				else if (x.mapped != null)
					return (x.mapped == y) ? Answer.YES : Answer.NO;
				else
					return Answer.NOINFO;
			}
		};

	static Criterion division =
		new Criterion() {
			Answer assess(Node x, Node y) {
				String xdiv = x.getDivision();
				String ydiv = y.getDivision();
				if (xdiv == ydiv)
					return Answer.NOINFO;	 // or Answer.YES ??
				else if (xdiv != null && ydiv != null) {
					y.addComment("not-same-division-as", x);
					return Answer.no(x, y, "different-division", null);
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
					return Answer.yes(x, y, "both-at-top", null); // Both are roots
				if (x0 == null || y0 == null)
					return Answer.NOINFO;

                if (x0.name.equals(y0.name))
                    return Answer.dull(x, y, "same-parent/simple", x0.name);
				else if (online(x0.name, y0) || online(y0.name, x0))
                    return Answer.dull(x, y, "same-parent/extended", x0.name);
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
					if (a != null)	// bad
						return Answer.yes(x, y, "overlaps", b.name);
					else
						return Answer.dull(x, y, "is-subsumed-by", b.name);
				} else {
					if (a != null)
						return Answer.no(x, y, "incompatible-with", a.name);
					else
						return Answer.NOINFO;
				}
			}
		};

	static Criterion source =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (x.extra != null && x.extra.length > 5) {
					String putativeSourceTag = x.extra[4];
					long putativeId = Long.parseLong(x.extra[5]);

					Node actualSource = null;
					for (Node source : y.sourcenodes)
						if (source.taxonomy.getTag().equals(putativeSourceTag)) {
							actualSource = source;
                            break;
						}

                    if (actualSource == null)
						return Answer.no(x, y, "different-source",
                                         (putativeSourceTag + ":" + putativeId));
					if (putativeId != (long)actualSource.id)
						return Answer.no(x, y, "different-source-id",
                                         (putativeSourceTag + ":" + putativeId
                                          + "->" +
                                          actualSource.getQualifiedId()));
                    else
                        return Answer.NOINFO;
				} else
                    return Answer.NOINFO;
			}
		};

	// x is source, y is union.	 don't match nondeprecated x with deprecated y.
    // not a good character... needs work
	static Criterion deprecation =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (x.deprecatedp != y.deprecatedp)
					return Answer.no(x, y, "different-deprecation-status", null);
				else
					return Answer.NOINFO;
			}
		};

	// E.g. Paraphelenchus
	static Criterion elimination =
		new Criterion() {
			Answer assess(Node x, Node y) {
				if (x.children != null && y.children != null) {
					return Answer.yes(x, y, "same-name-as/internal", null);
				} else {
					return Answer.yes(x, y, "same-name-as/tip", null);
				}
			}
		};

	// e.g. Phialina
	static Criterion complain =
		new Criterion() {
			Answer assess(Node x, Node y) {
                // we see this only in the unambiguous case
				return Answer.no(x, y, "unresolved", null); 
			}
		};

	static Criterion[] criteria = { division, subsumption, lineage, elimination };

	static Criterion[] idCriteria = { division, lineage, subsumption, source, elimination };

}


class Answer {
	Node x, y;					// The question is: Should x be mapped to y?
	int value;
	String reason;
	String witness;
	boolean interestingp = true;
	//gate c14
	Answer(Node x, Node y, int value, String reason, String witness, boolean i) {
		this.x = x; this.y = y;
		this.value = value;
		this.reason = reason;
		this.witness = witness;
		this.interestingp = i;
	}

	static Answer yes(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, 1, reason, witness, true);
	}

	static Answer dull(Node x, Node y, String reason, String witness) { // Uninteresting
		return new Answer(x, y, 1, reason, witness, false);
	}

	static Answer no(Node x, Node y, String reason, String witness) {
		return new Answer(x, y, -1, reason, witness, true);
	}

	static Answer noinfo(Node x, Node y, String reason) {
		return new Answer(x, y, 0, reason, null, true);
	}

	static Answer YES = new Answer(null, null, 1, "fiat", null, false);
	static Answer NO = new Answer(null, null, -1, "fiat", null, false);
	static Answer NOINFO = new Answer(null, null, 0, "no-info", null, false);

	String dump() {
		return
			(this.x == null ? "?" : this.x.name) + "\t" +

			(this.x == null ? "?" : this.x.getQualifiedId()) + "\t" +

			(this.value == 1 ?
			 "yes" :
			 (this.value == -1 ? "no" : ""+this.value)) + "\t" +

			this.reason + "\t" +

			(this.y == null ? "?" : this.y.id) + "\t" +

			this.witness + "\t" +

			//(this.x == null ? "?" : lossage(this.x)) + "\t" +

			this.interestingp ;
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
