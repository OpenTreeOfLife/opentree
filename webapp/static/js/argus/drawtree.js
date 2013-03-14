Array.prototype.average = function() {
    var sum = 0;
    var count = 0;
    var len = this.length;
    for (var i = 0; i < len; i++){
        sum += this[i];
        count++;
    }
    return sum/count;
}

function dir(obj) {
   var attrs = [];
   for(var key in obj){
      attrs.push([key,obj[key]]);
   }
   return attrs;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function buildUrl(focalclade) { 
    var address = "http://opentree-dev.bio.ku.edu:7476"
    var prefix = address+"/db/data/ext/GetJsons/node/";
    var suffix = "/getConflictTaxJsonAltRel";
    var url = prefix + focalclade + suffix; 
    return url;
}

function buildJSONQuery(argsobj) {

    /* An example JSON query string:
     * 
     * '{"domsource":"ncbi","nubrelid":12345,"altrels":[123,124,125]}'
     * 
     * much of this is irrelevant at this point. currently the only part of this
     * function in use is the domsource. it will be useful if/when we
     * decide to make queries more complex
     * */
    
    var empty = true;
    var previtem = false;
    
    if (typeof argsobj.domsource != "undefined") {
        if (empty) {
            var json = '{';
            empty = false;
        }
        json += '"domsource":"' + argsobj.domsource + '"';
        previtem = true;
    }

    if (typeof argsobj.altrelids != "undefined") {

        if (empty) {
            var json = '{';
            empty = false;
        }
        if (previtem)
            json += ",";

        json += '"altrels":[';
        for (i = 0; i < argsobj.altrelids.length; i++) {
            json += argsobj.altrelids[i];
            if (i == argsobj.altrelids.length - 1)
                json += ']';
            else
                json += ',';
        }
        previtem = true;
	}

	if (typeof argsobj.nubrelid != "undefined") {
        if (empty) {
            var json = '{';
            empty = false;
        }
        if (previtem)
            json += ",";

		json += '"nubrel":' + argsobj.nubrelid;	
    }

    if (!empty)
        json += '}';

	return json;
}

function drawNode(node, domsource, isfirst) {
    // if isfirst is undefined, then this is the root of a new tree; reset counters/containers
    var isfirst = (typeof isfirst !== "undefined" ? isfirst : true);    
    if (isfirst == true) {
        nodeshash = new Object();
        nodeswithcycles = new Array();
        isfirst = false;
        curleaf = 0;
    }

    // if this node has no children then we have hit a leaf
    var nchildren = (typeof node.children == "undefined" ? 0 : node.children.length);
    if (nchildren == 0) {

        // leaves are drawn at the rightmost x-coord, incrementally from the topmost y-coord
        node.x = xoffset;
        node.y = curleaf * nodeheight + yoffset;

        // draw the node
        var circle = paper.circle(node.x, node.y, r).attr({"fill": tipcolor}).toFront();
        var label = paper.text(node.x + xlabelmargin, node.y, node.name).
            attr({'text-anchor': 'start',"font-size":r*fontscalar});

        // create closure to access node attributes when hovering in/out
        function getHoverHandlerNode(attributes) {
            var nodeCircle = circle;
            return function() {nodeCircle.attr(attributes);};
        }

        circle.hover(getHoverHandlerNode({"fill": tiphovercolor}),getHoverHandlerNode({"fill": tipcolor}));

        curleaf++;

    // if the node has children then it is internal
    } else {
        var childxs = new Array();
        var childys = new Array();
        
        for (var i = 0; i < nchildren; i++) {
            // postorder traverse the children of this node
            drawNode(node.children[i], domsource, isfirst);

            // the traversal generated the childrens' coordinates; now get them
            if (isNumeric(node.children[i].x))
                childxs.push(node.children[i].x);
            if (isNumeric(node.children[i].y))
                childys.push(node.children[i].y);
        }

        // calculate this node's coordinates based on the positions of its children
        node.x = Math.min.apply(null, childxs) - nodewidth; // use this line for square trees
        node.y = childys.average();

        // scale size of node circle by number of contained leaves
        node.r = r + nodediamscalar * Math.log(node.nleaves);

        // draw node circle
        var label = paper.text(node.x - node.r, node.y + node.r, node.name).
            attr({'text-anchor': 'end',"font-size": r*fontscalar});
        var circle = paper.circle(node.x, node.y, node.r).attr({"fill": nodecolor});

        // create closures to access node attributes when hovering in/out and clicking
        function getHoverHandlerNode(attributes) {
            var nodeCircle = circle;
            return function() {nodeCircle.attr(attributes);};
        }
        
        // assign hover behaviors
        circle.hover(getHoverHandlerNode({"fill": nodehovercolor}),getHoverHandlerNode({"fill": nodecolor}));
        
        // draw branches (square tree)
        var spine_st = "M" + node.x + " " + node.children[0].y + "L" + node.x + " " + node.children[nchildren-1].y;
        var spine = paper.path(spine_st).toBack();
        for (var i = 0; i < nchildren; i++) {
            var branch_st = "M" + node.x + " " + node.children[i].y + "L" + node.children[i].x + " " + node.children[i].y;
            var branch = paper.path(branch_st).toBack();
        }
    }

    function getClickHandlerNode() {
        var thisnode = node;
        return function() {
            paper.clear();
            
    /* at some point we will probably want to retain a history of preferred alt relationships, etc.
    * these should be stored/retrieved from a base-level query info object that is passed back
    * and forth from the server. for now we are just keeping things simple and not remembering
    * anything about previous relationships.
    *                  var altrelids = new Array(); */

            var focalnodeid = thisnode.nodeid;
    //                var domsource = thisnode.source;
            var jsonargs = {"domsource": domsource};           

            var loadargs = {"url": buildUrl(focalnodeid),
                            "method": "POST",
                            "jsonquerystring": buildJSONQuery(jsonargs)};

            /* This is weird... Despite the paper object being declared in the global scope,
             * we end up with a duplicated paper object from the first query to the database.
             * It can be removed here by putting in the following line, but if this line follows
             * the loadData function then it will remove the current instead of the last paper
             * object. It is not clear why the first paper object is not overwritten by later
             * assignments to that variable name, but the code seems to work alright as is. */
            paper.remove();
            loadData(loadargs, paper.canvas.parentNode);};
    }

    circle.click(getClickHandlerNode());

    // if this node has cycles, record it; we will draw them once the tree is done
    var naltparents = (typeof node.altrels == "undefined" ? 0 : node.altrels.length);
    if (naltparents > 0) {
        nodeswithcycles.push(node.nodeid);
    }
    
    // store the node for fast access later
    nodeshash[node.nodeid] = node;
}

function drawCycles(focalnode) {

    var altrelsset = paper.set();
    altrelsset.hidden = false;

    function toggleAltRels() {
        var altrels = altrelsset;
        return function() {
            if (altrels.hidden == true) {
                altrels.show();
                altrels.hidden = false;
            } else {
                altrels.hide();
                altrels.hidden = true;
            }
        }
    }
    
    tx = 10;
    ty = 30;
    var togglelabel = paper.text(tx + r, ty + nodeheight*0.95, "toggle alt rels")
        .attr({'text-anchor': 'start',"font-size": r*fontscalar});

    var togglebox = paper.rect(tx, ty, nodewidth, nodeheight * 2)
        .attr({"stroke": "black","stroke-width": "1px", "fill": "white","fill-opacity": 0})
        .click(toggleAltRels());
        
    var body = $("body");
    $(window).bind("scroll",function() {
        togglebox.animate({"y": body.scrollTop() + ty},200);
        togglelabel.animate({"y": body.scrollTop() + ty + nodeheight},200);
    });

    // for each node found to have more than one parent
    for (var i = 0; i < nodeswithcycles.length; i++) {

        // this node is the child
        var child = nodeshash[nodeswithcycles[i]];
        var cx = child.x;
        var cy = child.y;

        // initialize nub object; it will contain links to topologies not present in the current tree
        var nub = new Object();
        nub.nodes = new Array();

        // for each alternative parent
        var naltparents = child.altrels.length;
        for (var j = 0; j < naltparents; j++) {

            // try to find this parent in the current tree
            var parent = nodeshash[child.altrels[j].parentid];

            // if the parent isn't in this tree, put it in the nub
            if (typeof parent == "undefined") {
                nub.nodes.push(child.altrels[j]);

            // the parent is in the tree; get its coordinates
            } else {
                var px = parent.x;
                var py = parent.y;

                // if the parent and child are vertically aligned, draw an offset line between them
                if (px == cx) {
                    x1 = cx - r;
                    if (py > cy) {
                        var offset = Math.abs(cx - x1);
                        y1 = cy + offset;
                        y2 = py - offset;
                    } else {
                        var offset = Math.abs(cx - x1);
                        y1 = cy - offset;
                        y2 = py + offset;
                    }
                    
                    // short diagonal connectors
                    var dst1 = "M" + cx + " " + cy + "L" + x1 + " " + y1;
                    var dst2 = "M" + x1 + " " + y2 + "L" + px + " " + py;
                    var dln1 = paper.path(dst1).attr({"stroke": altrelcolor});
                    var dln2 = paper.path(dst2).attr({"stroke": altrelcolor});
                    altrelsset.push(dln1);
                    altrelsset.push(dln2);

                    // main vertical line
                    var sst = "M" + x1 + " " + y1 + "L" + x1 + " " + y2;
                    var altrelline = paper.path(sst).attr({"stroke": altrelcolor});
             
                // if the parent and child are not vertically aligned, draw a straight line between them
                } else {
                    var dln = "M" + cx + " " + cy + "L" + px + " " + py;
                    var altrelline = paper.path(dln).attr({"stroke":altrelcolor});
                }
                altrelsset.push(altrelline);                

                var bw = 60;
                var bh = nodeheight;
                
                var altrellabel = paper.set();
                var altrellabelbox = paper.rect((cx+px)/2 - bw/2, (cy+py)/2 - bh /2, bw, bh)
                    .attr({"stroke": "black", "fill": "white"}).hide();
                var altrellabeltext = paper.text((cx+px)/2, (cy+py)/2, child.altrels[j].source)
                    .attr({"font-size": r * fontscalar}).hide();
                altrellabel.push(altrellabelbox);
                altrellabel.push(altrellabeltext);

                // create closure so we can access this alt rel info when the corresponding line is clicked
                function getClickHandlerAltRelLine() {

/* at some point we will probably want to retain a history of preferred altrelationships, etc.
 * these should be stored/retrieved from a base-level query info object that is passed back
 * and forth from the server. for now we are just keeping things simple and not remembering
 * anything about previous relationships.
 *                  var altrelids = // get altrels ;
 *                  altrelids.push(child.altrels[j].altrelid); */
                    
                    var focalnodeid = child.altrels[j].parentid;
//                    var domsource = child.altrels[j].source;

                    var jsonargs = {"domsource": child.altrels[j].source};

                    return function() {
                        paper.clear();
                        var loadargs = {"url": buildUrl(focalnodeid),
                                        "method": "POST",
                                        "jsonquerystring": buildJSONQuery(jsonargs)};
                        paper.remove();
                        loadData(loadargs, paper.canvas.parentNode);};
                }
                
                // create closure so we can affect properties when we hover in/out
                function getHoverHandlerAltRelLineShow(attributes) {
                    var linetomodify = altrelline;
                    var label = altrellabel;
                    return function() {linetomodify.attr(attributes); label.show().toFront();};
                }
                function getHoverHandlerAltRelLineHide(attributes) {
                    var linetomodify = altrelline;
                    var label = altrellabel;
                    return function() {linetomodify.attr(attributes); label.hide();};
                }                
                // apply behaviors
                altrelline.hover(getHoverHandlerAltRelLineShow({"stroke-width": "3px"}),
                        getHoverHandlerAltRelLineHide({"stroke-width": "1px"})).
                    click(getClickHandlerAltRelLine());
            }
        }
        
        // if there are parents not in the current tree, create a nub to represent them
        if (nub.nodes.length > 0) {

            // draw the nub
            nub.x = cx - (r*nubdistscalar);
            nub.y = cy + (r*nubdistscalar);
            nub.line = "M" + cx + " " + cy + "L" + nub.x + " " + nub.y;
            nub.dbr1 = paper.path(nub.line).attr({"stroke": altrelcolor});
            nub.circle = paper.circle(nub.x, nub.y, r).attr({"fill": altpcolor});

            // calc geometry for the nub info box, which contains links to alt topologies
            var infobox = paper.set();
            infobox.x = nub.x - (nodewidth*2+(xlabelmargin*2));
            infobox.y = nub.y;
            infobox.w = nodewidth*2+(xlabelmargin*2);
            infobox.h = nodeheight * (nub.nodes.length + 1);

            // draw the info box container
            var nublabelbox = paper.rect(infobox.x, infobox.y, infobox.w, infobox.h)
                .attr({"fill": "white"});

            // generate links for the infobox; use a paper.set object so we can easily toggle transparency
            var nublinks = paper.set();
            for (var j = 0; j < nub.nodes.length; j++) {
                
                // the link labels are the names of the corresponding sources
                linktext = nub.nodes[j].parentname + " > " + nub.nodes[j].source;

                // create closure so we can access nub.nodes[j] when we click a source link
                function getClickHandlerNubRelLink() {
                    
/* at some point we will probably want to retain a history of preferred altrelationships, etc.
 * these should be stored/retrieved from a base-level query info object that is passed back
 * and forth from the server. for now we are just keeping things simple and not remembering
 * anything about previous relationships.
 *                  var altrelids = new Array(); */

                    var focalnodeid = nub.nodes[j].parentid; // inherit this, passed to parent function
                    var domsource = nub.nodes[j].source;

                    var jsonargs = {"domsource": domsource}; 
                    var jsonquerystr = buildJSONQuery(jsonargs);

                    return function() {
                        paper.clear();
                        var loadargs = {"url": buildUrl(focalnodeid),
                                        "method": "POST",
                                        "jsonquerystring": jsonquerystr};
//                        alert(jsonquerystr);
                        paper.remove();
                        loadData(loadargs, paper.canvas.parentNode);};
                }

                // links are drawn in a vertical sequence within the infobox container
                thislink = paper.text(infobox.x + xlabelmargin, infobox.y + nodeheight + j*nodeheight,linktext)
                    .attr({"text-anchor": "start","font-size": r*fontscalar})
                    .click(getClickHandlerNubRelLink());
                
                // create closure so we can affect link properties when we hover in/out
                function getNubLinkHoverHandler(attributes) {
                    var nublinktomodify = thislink;
                    return function() {nublinktomodify.attr(attributes);};
                }
                
                // assign hover behavior
                thislink.hover(getNubLinkHoverHandler({"fill": altplinkcolor}),
                        getNubLinkHoverHandler({"fill": "black"}));
                
                nublinks.push(thislink);
            }

            // add links and infobox container to the infobox object, hide it from view
            infobox.push(nublinks);
            infobox.push(nublabelbox);
            infobox.hide();

            // create closures so we can set hover in/out behaviors on the infobox
            function getHoverHandlerShow() {
                var cSet = infobox;
                return function(){
                    cSet.show();
                    // bring the box to the front of the page
                    cSet[1].toFront();
                    // put the links in front of the box
                    cSet[0].toFront();
                };
            }
            function getHoverHandlerHide() {
                var cSet = infobox;
                return function(){
                     cSet.hide();
                };
            }

            // assign behaviors
            nub.circle.hover(getHoverHandlerShow(), getHoverHandlerHide());
            infobox.hover(getHoverHandlerShow(), getHoverHandlerHide());
        }
    }
}

var paperContainer; // DOM element that is the parent of the paper element
var paper; // raphael canvas object
var curleaf; // absolute leaf counter used in geometry
var nodeshash;
var nodeswithcycles;

// ------------------ begin geometry --------------------

// primary height scalar (also text size, node size, etc.)
var r = 5; // the minimum radius of the node/tip circles
// primary width scalar 
var nodewidth = 100; // the distance between parent/child nodes

var nubdistscalar = 4; // the x/y distance of the nub from its child
var sqnodedepthscalar = 20;
var fontscalar = 2.6; // multiplied by radius to set font size
var nodediamscalar = 1.5 // how much nodes are scaled by logleafcount
var tipoffset = 300; // distance from right margin at which leaf nodes are drawn
var ynodemargin = 4; // whitespace above/below nodes
var yoffset = 10; // distance from top margin at which topmost nodes are drawn
var xlabelmargin = 10; // the distance of the labels from the nodes
var nodeheight = 2*r + ynodemargin;

/* coordinates determining where the first nodes (i.e. tips) are drawn.
 * these are scaled to the size of the tree, and are set by the loadData()
 * function below. We declare them here to give them global scope */
var xoffset;
var yoffset;

// ------------------- end geometry ---------------------

// colors
var nodecolor = "#8af";
var nodehovercolor = "#bdf";
var tipcolor = "#14d";
var tiphovercolor = "#b8f";
var altrelcolor = "#f00";
var altpcolor = "#c69";
var altplinkcolor = "#900";

// call this function on first page load to get initial tree
//  @param `container` is passed to loadData as the DOM node that is the parent of the canvas
function setupAtNode(nodeid, domsource, container) {
    if (isBlank(domsource))
        domsource = "ottol";

    // call webservice to display graph for indicated node id
    if (!isBlank(nodeid)) {
        var jsonquerystring = buildJSONQuery({"domsource": domsource});
        var url = buildUrl(nodeid);
        var loadargs = {"url": url, "method": "POST", "jsonquerystring": jsonquerystring};
        loadData(loadargs, container);
    }
}

// call this function on first page load to get initial tree based on
//  the query portion of the URL (the location.search string) 
//  @param `container` is passed to loadData as the DOM node that is the parent of the canvas
function setup(container) {

    // extract variables from url string

    var domsource = "";
    if (location.search != "") {
        var tokstr = location.search.substr(1).split("?");
        var toks = String(tokstr).split("&");
        for (var i=0; i<toks.length; i++) {
            var arg = toks[i].split("=");
            if (arg[0] == "nodeid")
                nodeid = arg[1];
            else if (arg[0] == "domsource") {
                domsource = arg[1];
            }
        }
    }

    setupAtNode(nodeid, domsource, container);
}

// this function queries the db and draws the resulting tree.
// 
// @param The `container` arg should be the DOM node that should serve as
//      as the parent element for the canvas
function loadData(argsobj, container) {
    
    /* accepts three named arguments:
     *    url               the address to which the HTTP request is sent
     *    jsonquerystring   a json string containing query information
     *    method            e.g. GET or POST; POST is required for queries to the Neo4J REST service*/

    var url = argsobj.url;
    var jsonquerystr = argsobj.jsonquerystring;
    var method = argsobj.method;

    var xobjPost = new XMLHttpRequest();
    xobjPost.open(method, url, false);
    xobjPost.setRequestHeader("Accept", "");
    
    /* NOTE: we pass parameters to the REST service by encoding them in a JSON string
     * and sending it through the XMLHttpRequest.send() method. We must specify the
     * format of the incoming data (in this case JSON) with a call to
     * XMLHttpRequest.SetRequestHeader() before we issue the send. */
    xobjPost.setRequestHeader("Content-Type","application/json");
   
    xobjPost.onload =
      function() {

	var jsonrespstr = xobjPost.responseText;
        //    alert(jsonrespstr);
	var treedata = JSON.parse(eval(xobjPost.responseText));

	// calculate view-specific geometry parameters
	var pheight = ((2*r) + ynodemargin) * (treedata[0].nleaves) + (nubdistscalar * r) + (40*nodeheight);
	var pwidth = nodewidth*(treedata[0].maxnodedepth+1) + 1.5*tipoffset + xlabelmargin;
	xoffset = pwidth - nodewidth - tipoffset;

	var domsource = treedata[1].domsource;
    if (typeof container === 'undefined') {
        paper = Raphael(10, 10, 10, 10);
    }
    else {
        paper = Raphael(container, 10, 10);
    }
	paper.setSize(pwidth, pheight);
	var sourcelabel = paper.text(10, 10, "source: " + domsource).attr({"font-size": String(fontscalar*r) + "px", "text-anchor": "start"});

	// draw the tree
	drawNode(treedata[0],domsource);

	// draw the cylces
	drawCycles(treedata[0].children[0].nodeid);
      };

    // TBD: maybe add an 'onerror' handler too

    jsonquerystr = jsonquerystr == "" ? undefined : jsonquerystr;
    xobjPost.send(jsonquerystr);
}
